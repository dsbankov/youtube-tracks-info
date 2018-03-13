// ==UserScript==
// @name         Youtube Tracks Info: Key, BPM & RMS
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Displays the key, BPM & RMS of a track on youtube.
// @author       dsbankov
// @match        https://www.youtube.com/*
// @match        http://www.youtube.com/*
// @grant        none
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

$(document).ready(load_track_info); // first time load
window.addEventListener('spfdone', load_track_info); // page jump - old youtube design
window.addEventListener('yt-navigate-finish', load_track_info); // page jump - new youtube design
document.addEventListener('DOMContentLoaded', load_track_info); // one-time early processing

loading_info = false;

function load_track_info() {
    log("Youtube Tracks Info @ " + location.pathname);
    if (location.pathname === "/watch") {
        log("Loading track info...");
        $('#track_info').remove();
        setTimeout(function() {
            var video_title_container = $("#container > h1");
            $(video_title_container).ready(function() {
                if (video_title_container && video_title_container.length > 0 && video_title_container[0].innerText) {
                    var video_title = video_title_container[0].innerText;
                    var parsed_video_title = remove_non_word_characters(video_title);
                    log("Searching for track by video title: " + parsed_video_title);
                    if (!loading_info) {
                        loading_info = true;
                        $.ajax({
                            url: 'https://sleepy-beach-89012.herokuapp.com/trackAnalysis?q=' + parsed_video_title
                        }).done(function (response) {
                            log("Track found: " + JSON.stringify(response));
                            var key = response.key;
                            var loudness = response.loudness;
                            var tempo = response.tempo;
                            // $('h1').parent().append('<br/><h2 id="track_info" style="text-decoration: none; font-weight: normal; text-align: right">Key of ' + key + ', ' + tempo + ' BPM, ' + loudness + ' RMS' + '</h2>');
                            $('#count > yt-view-count-renderer').append('<h5 id="track_info" style="color: green; text-decoration: none; font-weight: normal; text-align: right; font-style: italic;">Key of ' + key + ', ' + tempo + ' BPM, ' + loudness + ' RMS' + '</h4>');
                            loading_info = false;
                        }).fail(function(response) {
                            log("Track not found: " + JSON.stringify(response));
                            loading_info = false;
                        });
                    }
                }
            });
        }, 1000);
    }
}

function remove_non_word_characters(video_title) {
    return video_title.replace(/(&|\?|=|\$|\+|\.|:|;|\/|,|@|>|<|#|%)/gi, ""); // remove special characters
    // var ws_marker = "999ABCD000";
    // var result = video_title;
    // result = result.replace(/\s+/gi, ws_marker); // replace all consecutive whitespace characters with the unique marker
    // result = result.replace(/\W+/gi, ""); // remove all non-word characters (&*()_=\..., this includes the whitespaces -> that's why we replace them with the marker beforehand)
    // result = result.replace(new RegExp(ws_marker, "gi"), " "); // bring back the whitespaces
    // return result;
    // return video_title.replace(/\s+/gi, ws_marker).replace(/\W+/gi, "").replace(new RegExp(ws_marker, "gi"), " ");
}

function log(msg) {
    console.log("YTTI: " + msg);
}