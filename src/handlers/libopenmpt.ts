import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

// libopenmpt is available from the website
// some of this code is borrowed from chiptune2.js under the MIT license

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

  async doConvert (
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const outputFiles: FileData[] = [];
    if (!libopenmpt) throw new Error("libopenmpt poorly :O");
    for (const currentfile of inputFiles) {
        outputFiles.push(
          {
            name: "wav",
            bytes: currentfile["bytes"]
          }
        );
    }
    return outputFiles;
  }

}

export default libopenmptHandler;