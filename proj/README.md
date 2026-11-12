# Health Care Assistant

Doctor and patient medicine reminder, based on the Smart Health Monitoring and Medicine Reminder System paper.

## Run in VS Code
1. File > Open Folder > this folder.
2. Terminal > `node server.js`, then open http://localhost:3000
   (or right-click `public/index.html` > Open with Live Server).

## Demo logins
- Doctor: doctor@demo.com / doc123
- Patient: patient@demo.com / pat123

## Files
- `public/index.html` page shell
- `public/app.js` logins, doctor and patient screens, 10 alarm sounds, alarm engine, vitals
- `public/style.css` theme; text slides left on hover or touch
- `public/particles.js` WebGL 3D particle background
- `server.js` tiny static server (no npm install needed)

## Rules
- Doctor: sees every patient's vitals and activity, adds, retimes and removes medicines.
- Patient: sees medicines grouped Morning / Afternoon / Evening, changes alarm sound and volume, takes or snoozes doses.
- Alarm rings with the medicine name; unconfirmed after 5 minutes it is logged as missed for the doctor.

## Note
Data is stored in the browser (localStorage), so doctor and patient share data only in the same browser. Different devices need a backend and database.
