# College-Application-System-Using-PHP-MYSQL
This university registration system project , I'm just sharing with the people who can make use of the project like this and at the same time for others like students who can learn from it. This project is complete but feel free to customise it the way you like its ok and i hope you will find it usefull one way or the other.  It is easy online application for managing any Universities Result Generation and Publication with save/print option. It is user friendly and fully responsive with suitable design. It supports Integrated multiple User accounts with Authorized Panel and Front end Admin authentication.
How to use the system  

Download the file and extract the content 

Paste the extracted file in www folder in your wamp server or htdocs folder if your using xamp server 

Run the project on your browser 

Click the quick guide button on the home page to download the user guide Do not worry about the database once you run the project it will be created automatically

## Campus student monitoring workspace

A new responsive browser application is available at the repository root. The original PHP project is preserved in `unima.zip`.

### Run locally

Requires Node.js 20.19+ or 22.12+ (verified with Node 24).

```sh
npm ci
npm run dev -- --port 3000
```

Open http://localhost:3000. Use `npm run build` to produce the deployable `dist/` folder, or `npm run preview` to serve a production build locally.

### Features

- Overview with 128 synthetic student profiles, attendance averages, performance distribution, and recent activity.
- Search and filter students by class or support status; add and edit profiles, academic scores, attendance snapshots, and teacher notes.
- Record present, absent, or late attendance by date and class; save and revisit daily records.
- Export student and academic reports, selected students, and recorded daily attendance as CSV.
- Global search (Ctrl/Cmd+K), notifications for students needing support, workspace settings, and responsive navigation.

This version is a local demonstration: it stores data in browser localStorage and has no server database or authentication. The overview attendance trend is explicitly labeled sample data. Student attendance percentages are editable profile snapshots; daily attendance is maintained separately. A student needs support if attendance is below 80% or academic score is below 60%. Otherwise, a score of 90% or above is excellent. Export important records before clearing browser storage.
