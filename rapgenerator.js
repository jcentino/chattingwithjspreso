var fs = require('fs');
var VOCreate = require('./examples/src/VOCreation.js');
var GetMediaInfo = require('./examples/src/GetMediaInfo.js');
var VOMixer = require('./examples/src/VOMixer.js');
var vo = new VOCreate();
var path = require('path');


var lyrics = fs.readFileSync('lyrics.txt', 'utf8');
lyrics = lyrics.split('\n');
lyrics = lyrics.join('<speechbreak>')

vo.create('en-GB', lyrics, function(result) {
   fs.writeFileSync( 'lyrics.mp3', result.audio, 'base64');

   new GetMediaInfo(path.resolve('lyrics.mp3'), function(err, asset) {
      var mixer = new VOMixer();
      var opts = {
         vo: 'lyrics.mp3',
         voLength: asset.duration,
         voSamplingRate: asset.samplingrate,
         bed: 'backbeat.mp3',
         fadeInDuration: 5,
         fadeOutDuration: 5,
         voDelay: 10,
         voEndPadding: 15,
         outFileSampleRate: 44100,
         outfile: 'hottrax.mp3'
      };
      mixer.mix(opts, function() {
         console.log('done');
      });
   });


});