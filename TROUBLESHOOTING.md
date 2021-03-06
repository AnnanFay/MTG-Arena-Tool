This is meant as a guide to help you locate and resolve the most common issues running MTG Arena Tool (Mtgatool). **Please** only follow these steps if you encounter one of the issues mentioned.

Common paths:
- Output log: `%APPDATA%\..\LocalLow\Wizards Of The Coast\MTGA\`
- Mtgatool data: `%APPDATA%\mtg-arena-tool`
- Mtgatool data (linux): `~/.config/MTG-Arena-Tool/`

### Stuck on 'please wait a minute' (without loading %)

Refer to this issue, the solution is in the comments:
[github.com/Manuel-777/MTG-Arena-Tool/issues/112](https://github.com/Manuel-777/MTG-Arena-Tool/issues/112)

### Screen does not respond to mouse events (overlay covers)

Toggle Edit mode (default `Alt + Shift + E`) or toggle an overlay.

### If the app freezes in loading "Just a second" page:
This is probably caused by an error reading the user configuration, probably due to an unhandled exception or new data added from MTGA that mtgatool is not handling properly. Bear in mind this issue is **not** because of a bad or improper installation, so reinstalling will make no difference. Although, you can roll back to a previous version safely if an update caused it.

Locate your log and config files;
- Go to the MTG Arena Tool "Settings" page (gear icon), then click on "Data"
- Copy the path to the "Arena Log"
- Close MTG Arena and MTG Arena Tool.
- Open the "Arena Log" path in a file browser
- Rename `Player.log`, do not delete it!
- Run MTGA, once open, run Mtgatool again.

If this works, send the the old log file file to [mtgatool@gmail.com](mailto:mtgatool@gmail.com) to analyze the error.

If that does not work;
- Go to the Mtgatool "Settings" page (gear icon), then click on "Data"
- In the bottom section called "Local Data", click on the link next to "Current player settings and history" (the .json file named with your User ID, something like `0A1F2E3E4D5C6B7A.json`)
- Rename the file, adding something to the end. **Do not delete it!**
- Run Mtgatool again.

If the last step worked, send your user-data file to [mtgatool@gmail.com](mailto:mtgatool@gmail.com) and I will inspect what is wrong with it.

### I want to reset all my historical data

If the amount of data is __small__ you can archive it all. The intended purpose of archiving is to remove from stats and hide from the UI.

If you have a patreon subscription with data syncing it is best to directly email [mtgatool@gmail.com](mailto:mtgatool@gmail.com). Otherwise some deleted data will be resynced.

Otherwise, with a large amount of bad data, it's best to rename the *user-data file*. (the .json file named with your User ID, something like `0A1F2E3E4D5C6B7A.json`)

### The tool didn't record some data (e.g. a match). Is there any way to restore it?
- Go to the folder `<mtgainstallfolder>\MTGA_Data\Logs\Logs` (Default: `C:\Program Files (x86)\Magic The Gathering Arena\MTGArena\MTGA_Data\Logs\Logs`)
- Copy all files with UTC_Log - xxx.log to a backup location
- Open them with your favorite text editor with regex search & replace capability (e.g. `Notepad++`)
- perform a search & replace 
  - tick `Regular Expressions` 
  - search field: `[\d+]`
  - leave the replace field empty
- save the edited files
- in the tool go to `Settings > Arena Data` and point the `Arena Log` to the previously modified files one by one

### App does not load / cant see login screen

You can try clearing the application data settings, to do so go to `%APPDATA%/mtg-arena-tool/` and delete `application.db`, then load Mtgatool again.
You might be asked to point at the path of the output log again.

### If you have any other unexpected behaviour

First of all, uninstalling and installing again will probably not change anything, as most errors are either configuration errors or log processing errors. Neither of them are solved by uninstalling. So, just to save you some time, make sure you have the latest version only.

Run the app then use `Alt+Shift+D` to open three developer consoles, one for each process (main, overlay and background).
Check if any of them has errors. If you see anything here (or anywhere else, really) you can submit to:
- [Discord](https://discord.gg/K9bPkJy)
- [Github issues](https://github.com/Manuel-777/MTG-Arena-Tool/issues)
- [mtgatool@gmail.com](mailto:mtgatool@gmail.com)
