Lore Notes Angular Application
Goal Description
The objective is to build the "Lore" note-taking application using Angular based on the provided mockup, and to prepare it for deployment on Azure with the lowest possible cost. The app will be accessible at a custom subpath (thumbaraguddi.in/lore), primarily for self-consumption.

Architecture & Hosting Plan (Lowest Cost on Azure)
To achieve virtually $0/month for hosting this application, we will use a 100% Serverless Architecture using Google Drive as the backend database.

Frontend (Angular): Hosted globally on Azure Static Web Apps edge nodes for free. We will configure it to serve from the /lore subpath.
Backend Engine: None! The Angular application will use the Google Identity Services libraries to authenticate the user.
Database: The user's personal Google Drive. The Angular app will use the Google Drive REST API to read and write a lore_data.json file in a dedicated App Data folder (or a specific folder).
Cost: $0 absolutely.
Pros: Your data lives essentially in your own Google Drive, with no backend server to maintain or pay for.
Proposed Changes
1. Frontend: Angular Setup
Initialize Workspace: Run npx @angular/cli@latest new lore-app --standalone --routing --style scss.
Configure Base Href: Update angular.json to build with --base-href /lore/ and --deploy-url /lore/ to support the custom subpath.
Port Mockup UI:
Convert the 
mockups/lore_mockup.html
 into Angular Components:
LoginComponent
SidebarComponent
TopbarComponent
NoteEditorComponent
Re-use the existing CSS variables, themes (dark, light, warm, green), and layout structures.
2. Google Identity & Drive API Integration
Google API Configuration: Integrate gapi (Google API Client Library) and Identity Services into the Angular application.
Drive Data Service: Create an Angular service GoogleDriveService that handles:
Logging in the user via Google Auth.
Finding or creating the lore_data.json file in the user's Drive.
Reading the JSON file into the Angular app's state.
Writing state updates back to the lore_data.json file on Google Drive whenever the user saves a note, shelf, or notebook.
3. CI/CD Deployment
Initialize Azure Static Web Apps locally using the Azure CLI or GitHub Actions to deploy the finalized Angular app build folder to the Edge CDN.
User Review Required
IMPORTANT

Google Cloud Console Project: To use Option 1, you will need to create a project in the Google Cloud Console, enable the Google Drive API, and configure an OAuth client ID for a Web application. You will then need to provide me with the Client ID.

Verification Plan
Automated & Local Verification
Start the Angular development server (ng serve) and verify the UI aesthetics and theming match the mockup perfectly.
Ensure Google Authentication flow succeeds and creates the lore_data.json in the user's Google Drive.
Deployment Verification
Build the app with base-href /lore/, simulate a subpath deployment via a local HTTP server, and then verify everything works prior to Azure deployment.


I want to create a note-talking application using angular based on the provided working prototype.  working prototype is in the "prototype" folder called lore_v2.html. Icons are in the same folder "lore-icons-v2.html".  This version is purely for self consumption. I have a domain : thumbaraguddi.in, this application either go in lore.thumbaraguddi.in or thumbaraguddi.in/lore on azure. Azure function or something which is 0$ hosting and maintainence charges. 

Here is how proto type works: 
1. On left nav bar, there are Selves, these contains notebooks. Each Note Books contains sections and in each sections, we have Notes. Each Notes will follow a template. 

2. We can export and import one shelf or one single notebook. 

3. User have a facility to define template that can be consumed in application. Import and export template should also be possible and implement at the same. 

4. Please look at the each template carefuly, how elemements are defined and how these elements are displayed on the notebook. 

5. I want no design change from the prototype. Implement as is in angular, Please use icons from "lore-icons-v2.html". 

6. For saving the notes and template, all files will be either saved in jason or md file. whichever you can choose. And it will go to google drive. 

7. when you implment we will bypass google sign on, and also saving it to google drive. we will implement later once our application starts working without any issues. 

