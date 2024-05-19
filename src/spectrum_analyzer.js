import AudioMotionAnalyzer from 'https://cdn.skypack.dev/audiomotion-analyzer?min';


export class SpectrumAnalyzer {
    constructor(api, audio) {
        this.audioMotion = new AudioMotionAnalyzer(
            document.getElementById('containerMusic'),
            {
                source: audio
            }
        );
    }
}