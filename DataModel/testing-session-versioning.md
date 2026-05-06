# Testing Session-Based Versioning

## Quick Test Guide

### Test 1: Basic Session Version Creation

1. **Open** http://localhost:4200/
2. **Click on any note** in the sidebar to open it
3. **Edit the note** - add some text (more than 50 characters)
4. **Switch to a different note** or close the pane
5. **Right-click on the first note** → Select "Version History"
6. **Check:** You should see a new "Session" version with timestamp

**Expected Result:** ✅ Session version created automatically

---

### Test 2: No Version for Minor Changes

1. **Open a note**
2. **Make a tiny edit** (less than 50 characters)
3. **Close the note**
4. **Check version history**

**Expected Result:** ✅ No new version created (changes too small)

---

### Test 3: Multiple Sessions

1. **Open a note**
2. **Edit and close** (creates version 1)
3. **Open same note again**
4. **Edit and close** (creates version 2)
5. **Check version history**

**Expected Result:** ✅ Two separate session versions

---

### Test 4: Console Logging

1. **Open browser console** (F12)
2. **Open a note**
3. **Look for:** `📝 Session started for note: [title]`
4. **Edit the note**
5. **Close the note**
6. **Look for:** `💾 Session version created for note: [title]`

**Expected Result:** ✅ Console logs show session lifecycle

---

### Test 5: Version Restoration

1. **Open a note with session versions**
2. **Right-click** → "Version History"
3. **Select a session version**
4. **Click "Restore"**
5. **Confirm restoration**

**Expected Result:** ✅ Note restored to that session's state

---

### Test 6: Browser Close

1. **Open a note**
2. **Make significant edits**
3. **Close the browser tab** (or refresh)
4. **Reopen the app**
5. **Check version history**

**Expected Result:** ✅ Version created before close (best-effort)

---

## What to Look For

### ✅ Success Indicators
- Session versions appear in version history
- Versions have "Session" badge
- Versions show timestamp and duration
- No versions for trivial changes
- Console logs show session lifecycle

### ❌ Issues to Report
- No versions created after editing
- Too many versions (every keystroke)
- Versions created with no changes
- Console errors
- Performance issues

---

## Console Commands for Testing

Open browser console and try:

```javascript
// Check if session is active for current note
// (You'll need to access the service through Angular DevTools)
```

---

## Expected Version History

After testing, you should see versions like:

```
v5  [Session]  2m ago
    Session 3:45 PM (15 min)
    Content changed

v4  [Session]  1h ago
    Session 2:30 PM (45 min)
    Title changed, Content changed

v3  [Milestone]  Yesterday
    "Before major refactor"
    
v2  [Session]  2d ago
    Session 10:15 AM (30 min)
    
v1  [Initial]  1w ago
    Initial Version
```

---

## Performance Check

- **Session start:** Should be instant (< 50ms)
- **Editing:** No lag or delay
- **Session end:** Should be instant (< 100ms)
- **Memory:** Check browser task manager - should be stable

---

## Next Steps After Testing

1. ✅ Verify automatic versioning works
2. ✅ Confirm no performance issues
3. ✅ Test version restoration
4. ✅ Check console logs
5. 📝 Report any issues found

---

**Happy Testing!** 🎉
