# Graphify Integration Plan for Lore App

**Date**: May 3, 2026  
**Purpose**: Integrate Graphify knowledge graph capabilities into Lore's Phase 10 implementation

---

## 📚 What is Graphify?

Graphify is an open-source tool that transforms codebases, documents, PDFs, images, and videos into queryable knowledge graphs. It's designed for AI coding assistants but can be adapted for note-taking applications.

**Key Features**:
- Extracts relationships from code, docs, and media
- Creates interactive HTML visualizations
- Generates graph reports with key insights
- Supports 25+ programming languages
- Local processing (privacy-first)
- MCP server for structured queries

**GitHub**: https://github.com/safishamsi/graphify  
**Package**: `graphifyy` (PyPI)

---

## 🎯 Integration Goals

### Primary Use Cases for Lore

1. **Note Knowledge Graph**
   - Visualize connections between notes, notebooks, and shelves
   - Show backlinks and forward links
   - Identify "hub" notes (most connected)
   - Discover surprising connections

2. **Content Analysis**
   - Extract key concepts from note content
   - Identify themes across notebooks
   - Show how ideas evolve over time
   - Find related notes based on semantic similarity

3. **AI-Enhanced Insights**
   - Generate "God nodes" (most important concepts)
   - Suggest questions based on graph structure
   - Identify knowledge gaps
   - Recommend notes to link together

---

## 🏗️ Architecture Options

### Option 1: Python Backend Service (Recommended)
**Pros**:
- Full Graphify functionality
- Can process notes server-side
- MCP server integration
- Real-time graph updates

**Cons**:
- Requires Python backend
- More complex deployment
- API calls needed

**Implementation**:
```
lore-backend/
├── graphify_service.py    # Python service
├── requirements.txt       # graphifyy dependency
└── api/
    ├── build_graph.py     # Build graph from notes
    ├── query_graph.py     # Query graph
    └── update_graph.py    # Incremental updates
```

### Option 2: Client-Side Graph Building (Current Phase 10 Plan)
**Pros**:
- No backend needed
- Works offline
- Simpler deployment

**Cons**:
- Limited to JavaScript graph libraries
- Can't use Graphify's extraction
- Manual relationship detection

**Implementation**:
- Use existing `GraphService` in Angular
- Build graph from note metadata and links
- Use D3.js or Cytoscape.js for visualization

### Option 3: Hybrid Approach (Best of Both)
**Pros**:
- Graphify for deep analysis (optional)
- Client-side for basic visualization
- Progressive enhancement

**Cons**:
- More complex architecture
- Two graph systems to maintain

---

## 📋 Recommended Implementation Plan

### Phase 1: Basic Client-Side Graph (Week 1)
**Goal**: Implement Phase 10 with existing tools

1. **GraphService Enhancement**
   - Build graph from note links (`[[Note Title]]`)
   - Track backlinks automatically
   - Calculate node importance (degree centrality)
   - Detect communities (notebooks/shelves)

2. **Visualization Component**
   - Use D3.js force-directed graph
   - Node colors by note type
   - Edge thickness by link frequency
   - Interactive zoom/pan
   - Node click to open note

3. **Graph Features**
   - Filter by shelf/notebook
   - Search nodes
   - Highlight paths between notes
   - Show orphan notes (no links)

**Deliverable**: Working knowledge graph in Lore app

---

### Phase 2: Graphify Integration (Week 2-3)
**Goal**: Add Graphify-powered insights

1. **Python Backend Setup**
   ```bash
   # Install Graphify
   pip install graphifyy
   
   # Create service
   python -m graphify.serve lore-graph.json
   ```

2. **Export Notes to Graphify Format**
   - Create export service in Angular
   - Convert notes to markdown files
   - Preserve metadata (tags, dates, type)
   - Include note links

3. **Build Graph with Graphify**
   ```bash
   # Export notes to temp directory
   /graphify ./lore-notes-export
   
   # Get graph.json and GRAPH_REPORT.md
   ```

4. **Import Graph Back to Lore**
   - Parse `graph.json`
   - Merge with existing graph
   - Display insights from `GRAPH_REPORT.md`

5. **MCP Server Integration**
   - Start Graphify MCP server
   - Query graph from Angular
   - Use for AI-powered suggestions

**Deliverable**: Enhanced graph with AI insights

---

### Phase 3: Advanced Features (Week 4)
**Goal**: Full Graphify integration

1. **Auto-Sync**
   - Watch for note changes
   - Incremental graph updates
   - Background processing

2. **AI-Powered Features**
   - "God nodes" dashboard
   - Surprising connections panel
   - Suggested questions
   - Knowledge gap detection

3. **Export Options**
   - Export to Obsidian vault
   - Generate graph.html
   - Neo4j export
   - GraphML for Gephi

**Deliverable**: Production-ready graph system

---

## 🔧 Technical Implementation

### 1. Install Graphify (Backend)

```bash
# In lore-backend directory
pip install graphifyy

# Or with optional features
pip install "graphifyy[mcp,office,video]"
```

### 2. Create Export Service (Angular)

```typescript
// lore-app/src/app/core/services/graphify-export.service.ts
import { Injectable, inject } from '@angular/core';
import { ShelfService } from './shelf.service';

@Injectable({ providedIn: 'root' })
export class GraphifyExportService {
  private shelfService = inject(ShelfService);

  /**
   * Export all notes to markdown format for Graphify
   */
  exportNotesToMarkdown(): Map<string, string> {
    const notes = this.shelfService.getAllNotes();
    const files = new Map<string, string>();

    notes.forEach(note => {
      const markdown = this.convertNoteToMarkdown(note);
      const filename = `${note.id}.md`;
      files.set(filename, markdown);
    });

    return files;
  }

  private convertNoteToMarkdown(note: Note): string {
    let md = `---\n`;
    md += `title: ${note.title}\n`;
    md += `type: ${note.type}\n`;
    md += `tags: ${note.tags.join(', ')}\n`;
    md += `created: ${note.createdAt.toISOString()}\n`;
    md += `updated: ${note.updatedAt.toISOString()}\n`;
    md += `---\n\n`;
    md += `# ${note.title}\n\n`;
    md += note.content;
    
    // Add blocks
    note.blocks.forEach(block => {
      md += `\n\n## ${block.type}\n\n`;
      md += block.content;
    });

    return md;
  }
}
```

### 3. Create Python Backend Service

```python
# lore-backend/graphify_service.py
from graphify import Graphify
from pathlib import Path
import json

class LoreGraphifyService:
    def __init__(self, notes_dir: str):
        self.notes_dir = Path(notes_dir)
        self.graph_output = Path("lore-graph-output")
    
    def build_graph(self):
        """Build knowledge graph from notes"""
        graphify = Graphify()
        result = graphify.process(
            self.notes_dir,
            output_dir=self.graph_output,
            mode="deep"
        )
        return result
    
    def query_graph(self, query: str):
        """Query the knowledge graph"""
        graph_file = self.graph_output / "graph.json"
        with open(graph_file) as f:
            graph = json.load(f)
        
        # Use Graphify's query functionality
        results = graphify.query(query, graph)
        return results
    
    def get_insights(self):
        """Get graph insights from report"""
        report_file = self.graph_output / "GRAPH_REPORT.md"
        with open(report_file) as f:
            report = f.read()
        return report
```

### 4. Create API Endpoints (FastAPI)

```python
# lore-backend/api/graph_api.py
from fastapi import FastAPI, UploadFile
from graphify_service import LoreGraphifyService

app = FastAPI()
service = LoreGraphifyService("./notes-export")

@app.post("/api/graph/build")
async def build_graph():
    """Build knowledge graph from notes"""
    result = service.build_graph()
    return {"status": "success", "graph": result}

@app.post("/api/graph/query")
async def query_graph(query: str):
    """Query the knowledge graph"""
    results = service.query_graph(query)
    return {"results": results}

@app.get("/api/graph/insights")
async def get_insights():
    """Get graph insights"""
    insights = service.get_insights()
    return {"insights": insights}
```

### 5. Angular Service to Call Backend

```typescript
// lore-app/src/app/core/services/graphify-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GraphifyApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/graph';

  buildGraph(): Observable<any> {
    return this.http.post(`${this.apiUrl}/build`, {});
  }

  queryGraph(query: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/query`, { query });
  }

  getInsights(): Observable<any> {
    return this.http.get(`${this.apiUrl}/insights`);
  }
}
```

---

## 🎨 UI Components

### 1. Graph Insights Panel

```typescript
// lore-app/src/app/features/graph/graph-insights/graph-insights.component.ts
@Component({
  selector: 'lore-graph-insights',
  template: `
    <div class="insights-panel">
      <h2>Knowledge Graph Insights</h2>
      
      <section class="god-nodes">
        <h3>Most Connected Notes</h3>
        @for (node of godNodes(); track node.id) {
          <div class="node-card" (click)="openNote(node.id)">
            <span class="node-title">{{ node.title }}</span>
            <span class="node-connections">{{ node.connections }} links</span>
          </div>
        }
      </section>
      
      <section class="surprising-connections">
        <h3>Surprising Connections</h3>
        @for (conn of surprisingConnections(); track conn.id) {
          <div class="connection-card">
            <span>{{ conn.from }} ↔ {{ conn.to }}</span>
            <span class="confidence">{{ conn.confidence }}</span>
          </div>
        }
      </section>
      
      <section class="suggested-questions">
        <h3>Suggested Questions</h3>
        @for (q of suggestedQuestions(); track q) {
          <button (click)="askQuestion(q)">{{ q }}</button>
        }
      </section>
    </div>
  `
})
export class GraphInsightsComponent {
  // Implementation
}
```

### 2. Graph Query Interface

```typescript
// lore-app/src/app/features/graph/graph-query/graph-query.component.ts
@Component({
  selector: 'lore-graph-query',
  template: `
    <div class="query-interface">
      <input 
        type="text" 
        [(ngModel)]="query"
        placeholder="Ask about your notes..."
        (keydown.enter)="executeQuery()"
      />
      <button (click)="executeQuery()">Search Graph</button>
      
      @if (results()) {
        <div class="results">
          @for (result of results(); track result.id) {
            <div class="result-card">
              <h4>{{ result.title }}</h4>
              <p>{{ result.excerpt }}</p>
              <span class="relevance">{{ result.score }}% relevant</span>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class GraphQueryComponent {
  // Implementation
}
```

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Lore App (Angular)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User creates/edits notes                                │
│  2. ShelfService stores in localStorage                     │
│  3. GraphifyExportService exports to markdown               │
│     ↓                                                        │
│  4. Send to backend API                                     │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Python Backend (FastAPI)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  5. Receive markdown files                                  │
│  6. Run Graphify on notes                                   │
│  7. Generate graph.json + GRAPH_REPORT.md                   │
│  8. Start MCP server for queries                            │
│     ↓                                                        │
│  9. Return graph data to frontend                           │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                        Lore App (Angular)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  10. GraphService merges Graphify data                      │
│  11. KnowledgeGraphComponent visualizes                     │
│  12. GraphInsightsComponent shows insights                  │
│  13. User queries graph via GraphQueryComponent             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Minimal Integration)

For immediate value without full backend:

1. **Export Notes to Files**
   ```typescript
   // Add export button in settings
   exportToGraphify() {
     const files = this.graphifyExportService.exportNotesToMarkdown();
     // Download as zip
     this.downloadAsZip(files, 'lore-notes-export.zip');
   }
   ```

2. **Run Graphify Locally**
   ```bash
   # User extracts zip
   unzip lore-notes-export.zip -d lore-notes
   
   # Run Graphify
   graphify ./lore-notes
   
   # Open graph.html in browser
   open lore-notes/graphify-out/graph.html
   ```

3. **Import Insights Back**
   ```typescript
   // Add import button
   importGraphifyResults(graphJson: File, reportMd: File) {
     // Parse and display in Lore
   }
   ```

---

## 📈 Benefits for Lore Users

1. **Discover Hidden Connections**
   - Find notes you forgot were related
   - Identify themes across notebooks
   - See how ideas evolved

2. **AI-Powered Insights**
   - "God nodes" show your most important concepts
   - Surprising connections reveal new perspectives
   - Suggested questions guide exploration

3. **Better Organization**
   - Identify orphan notes (no links)
   - Find knowledge gaps
   - Optimize note structure

4. **Enhanced Search**
   - Semantic search via graph
   - Path finding between concepts
   - Related note suggestions

---

## 🎯 Next Steps

### Immediate (This Week)
1. ✅ Research Graphify capabilities
2. ⏳ Decide on integration approach (Option 1, 2, or 3)
3. ⏳ Create proof-of-concept export

### Short Term (Next 2 Weeks)
4. ⏳ Implement basic graph visualization (Phase 10)
5. ⏳ Add export to Graphify format
6. ⏳ Test Graphify on sample notes

### Medium Term (Next Month)
7. ⏳ Build Python backend service
8. ⏳ Create API endpoints
9. ⏳ Integrate insights into UI
10. ⏳ Add MCP server support

---

## 📚 Resources

- **Graphify GitHub**: https://github.com/safishamsi/graphify
- **Graphify Docs**: https://graphify.net/
- **PyPI Package**: https://pypi.org/project/graphifyy/
- **MCP Protocol**: https://modelcontextprotocol.io/

---

## 🤔 Decision Required

**Which integration approach should we take?**

- **Option 1**: Full Python backend (most powerful, more complex)
- **Option 2**: Client-side only (simpler, less features)
- **Option 3**: Hybrid (best of both, most flexible)

**Recommendation**: Start with **Option 2** for Phase 10, then add **Option 3** in a future phase for enhanced features.

---

**Status**: 📋 Planning  
**Next Action**: Decide on integration approach  
**Owner**: Development team
