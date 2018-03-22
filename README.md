# youtube-tracks-info

The implementation of the service (server.js) needed for the Tampermonkey userscript (Youtube Tracks Info Key, BPM & RMS.user.js).

## Service

HTTP GET https://{URL}/trackAnalysis?q={video_title}

Will search for a track with name {video_title} via the Spotify API and return its key, BPM & RMS values (if found).

The response looks like this: {"artists":"Noisia,The Upbeats","track":"Dustup","id":"6c1hFCCh7JtC84gKIYzPb7","key":"B Minor","tempo":172,"loudness":"-4.2"}

## Userscript

Calls the above-mentioned service (which is deployed on heroku) and appends the returned track's info next to the youtube video.

## Install the userscript

https://greasyfork.org/en/scripts/39489-youtube-tracks-info-key-bpm-rms
