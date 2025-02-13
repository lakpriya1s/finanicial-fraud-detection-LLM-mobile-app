import React from "react";
import {
  StyleSheet,
  Text,
  Button,
  TextInput,
  SafeAreaView,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Pipeline } from "react-native-transformers";
import presets from "./presets.json";

export default function App() {
  const [progress, setProgress] = React.useState<number>();
  const [input, setInput] = React.useState<string>(
    "What is a Financial Fraud?"
  );
  const [output, setOutput] = React.useState<string>();

  const loadModel = async (preset: {
    name: string;
    model: string;
    onnx_path: string;
    options?: any;
  }) => {
    console.log("loading");

    let name = preset.name;

    const fetchWithCache = async (url: string) => {
      const localDir = FileSystem.cacheDirectory + `${name}/`;

      const localPath = localDir + url.split("/").pop()!;

      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(localDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
      }

      // Check if the file already exists
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        console.log("File exists locally: " + localPath);
        return localPath; // Return the local path if the file already exists
      }

      // If the file doesn't exist, proceed with downloading
      console.log("Downloading... " + url);
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localPath,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          setProgress(totalBytesWritten / totalBytesExpectedToWrite);
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

    console.log("loaded");
  };

  const AutoComplete = () => {
    Pipeline.TextGeneration.generate(input, setOutput);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text>Select a model</Text>
      {presets.map((preset) => (
        <Button
          key={preset.name}
          title={preset.name}
          onPress={() => {
            loadModel(preset);
          }}
        />
      ))}
      <Text>Input: </Text>
      <TextInput value={input} onChangeText={setInput} style={styles.input} />
      <Text>Output: {output}</Text>
      <Text>
        {progress === undefined
          ? ""
          : progress < 1
          ? `Downloading: ${progress * 100}%`
          : "Downloaded and loaded"}
      </Text>
      <Button title="Run" onPress={AutoComplete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "black",
  },
});
