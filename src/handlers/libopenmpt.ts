import { buffer } from "three/tsl";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

// libopenmpt is available from the website
// some of this code is borrowed from chiptune2.js under the MIT license
// and some documentation made by generative AI to account for the
// lack of JS/WebAssembly documentation on OpenMPT's part

import * as libopenmpt from "./libopenmpt/bin/wasm/libopenmpt.js";

class libopenmptHandler implements FormatHandler {

  public name: string = "libopenmpt";
  public supportedFormats: FileFormat[] = [
    {
      name: "ProTracker Module",
      format: "mod",
      extension: "mod",
      mime: "audio/mod",
      from: true,
      to: false,
      internal: "mod"
    },
    {
      name: "FastTracker II Module",
      format: "xm",
      extension: "xm",
      mime: "audio/xm",
      from: true,
      to: false,
      internal: "xm"
    },
    {
      name: "Scream Tracker 3 Module",
      format: "s3m",
      extension: "s3m",
      mime: "audio/s3m",
      from: true,
      to: false,
      internal: "s3m"
    },
    {
      name: "Impulse Tracker Module",
      format: "it",
      extension: "it",
      mime: "audio/it",
      from: true,
      to: false,
      internal: "it"
    },
    {
      name: "Waveform Audio File Format",
      format: "wav",
      extension: "wav",
      mime: "audio/wav",
      from: false,
      to: true,
      internal: "wav"
    }
  ];
  public ready: boolean = false;
  async init () {
    
    this.ready = true;
  }

  convertToWav(samples: Float32Array, samplerate: number): Uint8Array {
    const filebuffer = new ArrayBuffer(44 + (samples.length * 2));
    const dView = new DataView(filebuffer);
    const asciijot = (offset: number, asciistr: string) => {
      for (var i = 0; i < asciistr.length; i++) {
        dView.setUint8(offset + i, asciistr.charCodeAt(i));
      };
    };
    asciijot(0,"RIFF");
    dView.setUint32(4, (36 + (samples.length * 2)), true);
    asciijot(8, "WAVE");
    asciijot(12, "fmt ");
    dView.setUint32(16, 16, true);
    dView.setUint16(20, 1, true);
    dView.setUint16(22, 2, true);
    dView.setUint32(24, samplerate, true);
    dView.setUint32(28, (samplerate * 4), true);
    dView.setUint16(32, 4, true);
    dView.setUint16(34, 16, true);
    asciijot(36, "data");
    dView.setUint32(40, (samples.length * 2), true);
    let audiooffset = 44;
    for (var i = 0; i < samples.length; i++, audiooffset += 2) {
      const samp = Math.max(-1, Math.min(1, samples[i]));
      const intSamp = samp < 0 ? samp * 0x8000 : samp * 0x7fff;
      dView.setInt16(audiooffset, intSamp, true);
    };
    return new Uint8Array(filebuffer);
  };

  async doConvert (
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const outputFiles: FileData[] = [];
    if (!libopenmpt) throw new Error("libopenmpt non't");
    for (const currentfile of inputFiles) {
        const OPENMPT_MODULE_RENDER_STEREOSEPARATION_PERCENT = 2;
        const OPENMPT_MODULE_RENDER_INTERPOLATIONFILTER_LENGTH = 3;
        const fileData = libopenmpt._malloc(currentfile["bytes"].length);
        libopenmpt.HEAPU8.set(currentfile["bytes"], fileData);
        const moduleMem = libopenmpt._openmpt_module_create_from_memory(fileData, currentfile["bytes"].length, 0, 0, 0);
        if (!moduleMem) throw new Error("libopenmpt cannot do it");
        const samplerate = 48E3;
        const maxframes = 2**12;
        const leftframes = libopenmpt._malloc(4 * maxframes);
        const rightframes = libopenmpt._malloc(4 * maxframes);
        const rawAudio: number[] = [];
        while(true) {
          const readframes = libopenmpt._openmpt_module_read_float_stereo(moduleMem, samplerate, maxframes, leftframes, rightframes);
          if (readframes == 0) break;
          const left = libopenmpt.HEAPF32.subarray(
            (leftframes / 4),
            (leftframes / 4 + readframes)
          );
          const right = libopenmpt.HEAPF32.subarray(
            (rightframes / 4),
            (rightframes / 4 + readframes)
          );
          for (var i = 0; i < readframes; i++) {
            rawAudio.push(left[i],right[i]);
          };
          libopenmpt._openmpt_module_destroy(moduleMem);
          libopenmpt._free(fileData);
          libopenmpt._free(leftframes);
          libopenmpt._free(rightframes);
        };
        const wavby = this.convertToWav(new Float32Array(rawAudio), samplerate);
        outputFiles.push({
          name: currentfile.name.replace(/\.\w+$/, ".wav"),
          bytes: wavby
        });
    }
    return outputFiles;
  }

}

export default libopenmptHandler;