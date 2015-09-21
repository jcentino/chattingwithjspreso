/**
 * Copied from Node-Google-Text-To-Speech module
 * https://github.com/ashafir20/node-google-text-to-speech
 *
 * Altered to not change output to Base64 String, and since I'm
 * modifying it for my own purposes, I'll make it more directly tied in
 * as a VO creation script
 */
var fs = require('fs');
var http = require('http');
var path = require('path');

/**
 * Escape special characters in the given string of html.
 *
 * @param  {String} languageLocale = the target locale language (example : en)
 * @param  {String} word = the word to translate to speech
 * @param  {function({'audio' : String, 'message' : String })} callback = function invoked on translate completed with two
 * arguments : audio data as base64 and success true for translated ok and false otherwise
 */
var VOCreation = function() {
    var self = this;

    /** voice cache to avoid duplicate requests */
    this.voiceCache = {};

    /** max chars in each network request */
    this.maxChars = 80;

    /** response speech data */
    this.data = [''];

    /** url for TTS request */
    this.url = 'http://translate.google.com/translate_tts?tl=';

    /** language locale */
    this.locale = '';

    /**
     * c-tor
     */
    this.init = function() {};

    /**
     * create VO
     * @param languageLocale
     * @param words
     * @param callback
     */
    this.create = function(languageLocale, words, callback) {
        this.callback = callback;
        this.locale = languageLocale;
        //words = words.replace('*', 'o');
        var chunked = words.split(' ');
        this.requests = [''];

        // separate network requests by words vs character limits
        for (var chunk in chunked) {
            this.appendWord(chunked[chunk]);
        }

        // clean the list
        this.requests = this.requests.filter(function(value) {
            return value !== '';
        });

        this.requests.reverse();
        this.nextRequest();
    };

    /**
     * append word to requests
     * @param txt
     */
    this.appendWord = function(txt) {
        if (txt === '' || txt === ' ') {
            return;
        }

        // handle speech breaks
        if (txt.indexOf(VOCreation.SPEECHBREAK) > -1) {
            var wrds = txt.split(VOCreation.SPEECHBREAK);
            for (var c in wrds) {
                if ( self.requests[self.requests.length-1] !== '') {
                    self.appendWord(wrds[c]);
                    self.requests[self.requests.length-1] = self.requests[self.requests.length-1].trim();
                    self.requests.push('');
                } else {
                    self.appendWord(wrds[c]);
                }
            }
            return;
        }

        // make new request if over max char limit
        if (self.requests[self.requests.length-1].length + txt.length >= self.maxChars) {
            self.requests[self.requests.length-1] = self.requests[self.requests.length-1].trim();
            self.requests.push(txt);
        } else {
            self.requests[self.requests.length-1] += txt + ' ';
        }
    };

    /**
     * make request
     */
    this.nextRequest = function() {
        var txt = self.requests.pop();
        console.log(self.url + self.locale + '&q=' + txt)

        var options = {
            host: 'translate.google.com',
            path: '/translate_tts?tl=' +self.locale + '&q=' + encodeURI(txt) + '&client=t',
            method: 'GET',
            headers: {
                'User-Agent': 'stagefright/1.2 (Linux;Android 5.0)',
                'Referer': 'http://translate.google.com/'
            }
        };
        var req = http.request(options, function(response) {
            response.setEncoding('base64');
            response.on('data', function (chunk) {
                self.data[self.data.length-1] += chunk;
            });

            response.on('end', function () {
                console.log('VOCreation', 'Created VO Segment: ' + txt);
                self.onRequestComplete(txt);
            });

            response.on('error', function (err) {
                console.log('Error: ', err);
                self.onRequestComplete(txt);
            });
        });
        req.end();
    };

    /**
     * on request complete - finish or do next
     */
    this.onRequestComplete = function(txt) {
        if (self.requests.length > 0 ) {
            self.data.push('');
            self.nextRequest();
        } else {
            var result = {'audio': self.data.join(), 'success': true};
            self.callback(result);
            self.data = [];
        }
    };

    this.init();
};

VOCreation.SPEECHBREAK = '<speechbreak>';

exports = module.exports = VOCreation;