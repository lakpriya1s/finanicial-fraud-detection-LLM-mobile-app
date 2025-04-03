import * as FileSystem from "expo-file-system";
import { Pipeline } from "react-native-transformers";

export const checkIfModelExists = async (preset: {
  name: string;
  model: string;
  onnx_path: string;
  options?: any;
}) => {
  return new Promise(async (resolve, reject) => {
    const localDir = FileSystem.cacheDirectory + `${preset.name}/`;
    const fileInfo = await FileSystem.getInfoAsync(localDir);
    resolve(fileInfo.exists);
  });
};

export const loadModel = async (
  preset: {
    name: string;
    model: string;
    onnx_path: string;
    options?: any;
  },
  setProgress: (progress: number) => void,
  onComplete: () => void
) => {
  console.log("loading");

  let name = preset.name;

  const fetchWithCache = async (url: string) => {
    const localDir = FileSystem.cacheDirectory + `${name}/`;

    const localPath = localDir + url.split("/").pop()!;

    const dirInfo = await FileSystem.getInfoAsync(localDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
    }

    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      onComplete();
      console.log("File exists locally: " + localPath);
      return localPath;
    }

    console.log("Downloading... " + url);
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localPath,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        setProgress(totalBytesWritten / totalBytesExpectedToWrite);
        console.log("progress", totalBytesWritten / totalBytesExpectedToWrite);
      }
    );
    const result = await downloadResumable.downloadAsync();
    if (result === undefined) {
      throw new Error("Download failed.");
    }
    console.log("Downloaded as " + result.uri);
    return result.uri;
  };

  await Pipeline.TextGeneration.init(preset.model, preset.onnx_path, {
    verbose: true,
    fetch: fetchWithCache,
    ...preset.options,
  });

  onComplete();

  console.log("loaded");
};