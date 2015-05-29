define(function (require) {
  'use strict';

  var p5sound = require('master');

  /**
   *  <p>PeakDetect works in conjunction with p5.FFT to
   *  look for onsets in some or all of the frequency spectrum.
   *  </p>
   *  <p>
   *  To use p5.PeakDetect, call <code>update</code> in the draw loop
   *  and pass in a p5.FFT object.
   *  </p>
   *  <p>
   *  You can listen for a specific part of the frequency spectrum by
   *  setting the range between <code>freq1</code> and <code>freq2</code>.
   *  </p>
   *
   *  <p><code>threshold</code> is the threshold for detecting a peak,
   *  scaled between 0 and 1. It is logarithmic, so 0.1 is half as loud
   *  as 1.0.</p>
   *
   *  The update method is meant to be run in the draw loop, and
   *  <code>frames</code> determines how many loops must pass before
   *  another peak can be detected.
   *  For example, if the frameRate() = 60, you could detect the beat of a
   *  120 beat-per-minute song with this equation:
   *  <code> framesPerPeak = 60 / (estimatedBPM / 60 );</code>
   *
   *  Based on example contribtued by @b2renger, and a simple beat detection
   *  explanation by <a
   *  href="http://www.airtightinteractive.com/2013/10/making-audio-reactive-visuals/"
   *  target="_blank">Felix Turner</a>.
   *  
   *  @class  PeakDetect
   *  @constructor
   *  @param {Number} [freq1]     lowFrequency - defaults to 20Hz
   *  @param {Number} [freq2]     highFrequency - defaults to 20000 Hz
   *  @param {Number} [threshold] Threshold for detecting a beat between 0 and 1
   *                            scaled logarithmically where 0.1 is 1/2 the loudness
   *                            of 1.0. Defaults to 0.25.
   *  @param {Number} [framesPerPeak]     Defaults to 5.
   *  @example
   *  <div><code>
   *  
   *  var cnv, soundFile, fft, peakDetect;
   *  var ellipseWidth = 10;
   *
   *  function setup() {
   *    cnv = createCanvas(100,100);
   *
   *    soundFile = loadSound('assets/beat.mp3');
   *    fft = new p5.FFT();
   *    peakDetect = new p5.PeakDetect();
   *
   *    setupSound();
   *  }
   *
   *  function draw() {
   *    background(0);
   *
   *    fft.analyze();
   *    peakDetect.update(fft);
   *
   *    if ( peakDetect.isDetected ) {
   *      ellipseWidth = 50;
   *    } else {
   *      ellipseWidth *= 0.95;
   *    }
   *
   *    ellipse(width/2, height/2, ellipseWidth, ellipseWidth);
   *  }
   *
   *  function setupSound() {
   *    cnv.mouseClicked( function() {
   *      if (soundFile.isPlaying() ) {
   *        soundFile.stop();
   *      } else {
   *        soundFile.play();
   *      }
   *    });
   *  }
   */
  p5.PeakDetect = function(freq1, freq2, threshold, _framesPerPeak) {
    var framesPerPeak;

    // framesPerPeak determines how often to look for a beat.
    // If a beat is provided, try to look for a beat based on bpm

    this.framesPerPeak = _framesPerPeak || 5;
    this.framesSinceLastPeak = 0;
    this.decayRate = 0.95;

    this.threshold = threshold || 0.25;
    this.cutoff = 0;

    this.energy = 0;
    this.penergy = 0;

    /**
     *  isDetected is set to true when a peak is detected.
     *  
     *  @attribute isDetected
     *  @type {Boolean}
     *  @default  false
     */
    this.isDetected = false;

    this.f1 = freq1 || 40;
    this.f2 = freq2 || 20000;

    // function to call when a peak is detected
    this._onPeak = function() {};
  };


  /**
   *  The update method is run in the draw loop.
   *
   *  Accepts an FFT object. You must call .analyze()
   *  on the FFT object prior to updating the peakDetect
   *  because it relies on a completed FFT analysis.
   *
   *  @method  update
   *  @param  {p5.FFT} fftObject A p5.FFT object
   */
  p5.PeakDetect.prototype.update = function(fftObject) {
    var nrg = this.energy = fftObject.getEnergy(this.f1,this.f2)/255;
    if (nrg > this.cutoff && nrg > this.threshold && nrg-this.penergy > 0){

      // trigger callback
      this._onPeak();
      this.isDetected = true;

      // debounce
      this.cutoff = nrg * 1.1;
      this.framesSinceLastPeak = 0;
    } else {
      this.isDetected = false;
      if (this.framesSinceLastPeak <= this.framesPerPeak) {
        this.framesSinceLastPeak++;
      } else {
        this.cutoff *= this.decayRate;
        this.cutoff = Math.max(this.cutoff, this.threshold);
      }
    }
    this.penergy = nrg;
  };

  /**
   *  onPeak accepts two arguments: a function to call when
   *  a peak is detected, and optionally a value to pass
   *  into that function.
   *   
   *  @param  {Function} callback Name of a function that will
   *                              be called when a peak is
   *                              detected.
   *  @param  {Object}   [val]    Optional value to pass
   *                              into the function when
   *                              a peak is detected.
   *  @example
   *  <div><code>
   *  var cnv, soundFile, fft, peakDetect;
   *  
   *  function setup() {
   *    cnv = createCanvas(100,100);
   *    
   *    cnv.mouseClicked = function() {
   *      soundFile.play();
   *    }
   *    
   *  }
   *
   *  function draw() {
   *  
   *  }
   *
   *  </code></div>
   */
  p5.PeakDetect.prototype.onPeak = function(callback, val) {
    var self = this;

    self._onPeak = function() {
      callback(self.energy, val);
    };
  };

});