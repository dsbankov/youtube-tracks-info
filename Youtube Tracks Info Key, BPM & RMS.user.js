// ==UserScript==
// @name         Youtube Tracks Info: Key, BPM & RMS
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/watch?*
// @match        http://www.youtube.com/watch?*
// @grant        none
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// ==/UserScript==

$(document).ready(load_track_info); // first time load
window.addEventListener('spfdone', load_track_info); // page jump - old youtube design
window.addEventListener('yt-navigate-finish', load_track_info); // page jump - new youtube design
document.addEventListener('DOMContentLoaded', load_track_info); // one-time early processing

loading_info = false;

function load_track_info() {
    console.log("Youtube Tracks Info @ " + location.pathname);
    if (location.pathname === "/watch") {
        console.log("Loading track info...");
        $('#track_info').remove();
        setTimeout(function() {
            var video_title_container = $("#container > h1");
            $(video_title_container).ready(function() {
                if (video_title_container && video_title_container.length > 0 && video_title_container[0].innerText) {
                    var video_title = video_title_container[0].innerText;
                    console.log("Searching for track by video title: " + video_title);
                    if (!loading_info) {
                        loading_info = true;
                        $.ajax({
                            url: 'https://sleepy-beach-89012.herokuapp.com/trackAnalysis?q=' + video_title
                        }).done(function (response) {
                            console.log("Track found: " + JSON.stringify(response));
                            var key = response.key;
                            var loudness = response.loudness;
                            var tempo = response.tempo;
                            $('h1').parent().append('<br/><h2 id="track_info" style="text-decoration: none; font-weight: normal; text-align: right">Key of ' + key + ', ' + tempo + ' BPM, ' + loudness + ' RMS' + '</h2>');
                            loading_info = false;
                        }).fail(function(response){
                            console.log("Track not found: " + JSON.stringify(response));
                            loading_info = false;
                        });
                    }
                }
            });
        }, 1000);
    }
}