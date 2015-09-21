var child_process = require("child_process");
var xml2js = require('xml2js');

/**
 * get media info for asset
 * @param {String | Object} asset
 * @param cb
 * @param config
 * @constructor
 */
function GetMediaInfo(asset, cb) {

    var self = this;

    /**
     * on media info callback
     * @param error
     * @param info
     * @private
     */
    this._onMediaInfo = function(error, info) {
        if (info.Mediainfo) { info = info.Mediainfo };
        var resolved = {};

        if (error) {
            var e = new Error("Could not get Media Info for " + asset + " (" + error.toString() + ")");
            console.log("GetMediaInfo", e.toString());
            cb(e, asset);
            return;
        }

        if (info && info.File[0] && info.File[0].track && info.File[0].track.length) {
            info.File[0].track.forEach(function (track) {
                console.log("GetMediaInfo", "Resolved " + asset);
                if (track.Album) {
                    asset.album = track.Album;
                }
                if (track.Track_name) {
                    asset.title = track.Track_name;
                }
                if (track.Performer) {
                    asset.artist = track.Performer;
                }
                if (track.Track_name && track.Performer) {
                    asset.label = track.Track_name + " - " + track.Performer;
                }
                if (track.Recorded_date) {
                    asset.recordingDate = track.Recorded_date;
                }
                if (track.Duration) {
                    asset.duration = self._parseDuration(track.Duration);
                }

                // todo: proper audio bitrate for videos
                if (track.Overall_bit_rate) {
                    asset.bitrate = track.Overall_bit_rate;
                }

                if (track.Sampling_rate) {
                    asset.samplingratelabel = track.Sampling_rate;
                    asset.samplingrate = track.Sampling_rate[0].split(' ')[0] * 1000;
                }
            });
        } else {
            var e = new Error("Could not get Media Info for " + asset.filename);
            console.log("GetMediaInfo", e.toString());
            cb(e, asset);
            return;
        }

        cb(null, asset);
    };

    /**
     * parse duration
     * @param duration string
     * @return duration in seconds
     * @private
     */
    this._parseDuration = function(dur) {
        // is this string standard in all metadata? hope so
        var time = dur[0].split(" ");
        var min = 0;
        var sec = 0;
        var hrs = 0;

        if (time.length < 2) {
            console.log("GetMediaInfo", "Problem getting file duration");
            return 0;
        }

        for (var c in time) {
            if (time[c].indexOf("mn") != -1) {
                min = parseInt(time[c].substr(0, time[c].indexOf("mn")));
            } else if (time[c].indexOf("ms") != -1) {
                //nothing - no need for milliseconds
            } else if (time[c].indexOf("s") != -1) {
                sec = parseInt(time[c].substr(0, time[c].indexOf("s")));
            } else if (time[c].indexOf("h") != -1) {
                hrs = parseInt(time[c].substr(0, time[c].indexOf("h")));
            }
        }

        var ttl = hrs * 3600 + min * 60 + sec;
        return ttl;
    };

    var srcid;
    var ref;

    if (typeof asset === 'string') {
        ref = asset;
        asset = { filename: asset };
    } else {
        if (asset.source && asset.source.id) { srcid = asset.source.id; }
        if (asset.sourceid) { srcid = asset.sourceid; }
        ref = asset.filename;
    }


    if (ref == null) {
        var e = new Error("Resolve File Download Error, File does not exist: " + asset.filename);
        console.log("GetMediaInfo", e.toString());
        cb(e, asset);
        return;
    } else {
        child_process.execFile('./examples/src/MediaInfo.exe', ["--Output=XML"].concat(ref), function(err, stdout, stderr) {
            var parser = new xml2js.Parser();
            parser.addListener('end', function(result) {
                self._onMediaInfo(null, result);
            });
            var info = parser.parseString(stdout);
        });
    }
}

exports = module.exports = GetMediaInfo;