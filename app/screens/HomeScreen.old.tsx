import React from "react";
import { View, TextInput, Text, Button, StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system";
import { Pipeline } from "react-native-transformers";
import presets from "../../presets.json";

const HomeScreen = () => {
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

            const dirInfo = await FileSystem.getInfoAsync(localDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
            }

            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
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
        const chatPrompt = `<|im_start|>system
  You are a helpful assistant that detects financial fraud. Respond with 'Yes' or 'No' only.<|im_end|>
  <|im_start|>user
  Is the following text fraudulent?
  
  Text: CONFIDENTIAL=2FCOOPERATIONIT IS MY GREAT PLEASURE IN WRITING YOU THIS LETTER ON BEHALF OF MYCOLLEAGUES AND MYSELF=2EYOUR PARTICULARS WERE GIVEN TO ME BY A MEMBER OF THE NIGERIAN EXPORTPROMOTION COUNCIL =28NEPC=29 WHO WAS AT THE FEDERAL GOVERNMENT DELEGATION TOYOUR COUNTRY DURING A TRADE EXHIBITION=2E I HAVE DECIDED TO SEEK ACONFIDENTIAL COOPERATION WITH YOU IN THE EXECUTION OF THE DEAL DESCRIBEDHERE FOR THE BENEFIT OF ALL PARTIES INVOLVED AND HOPE THAT YOU WILL KEEP ITAS TOP SECRET BECAUSE OF THE NATURE OF THE BUSINESS AND THE PERSONALITIESINVOLVED=2EWITHIN THE MINISTRY OF POWER AND STEEL WHERE I WORK AS A DIRECTOR PROJECTIMPLEMENTATION AND WITH THE COOPERATION OF FOUR OTHER TOP OFFICIALS=2C WE HAVEIN OUR POSSESSION AS OVERDUE PAYMENT BILLS TOTALLING $67=2C000 000=3A00m USD=28SIXTY SEVEN MILLION UNITED STATE DOLLARS=29 WHICH WE WANT TO TRANSFER ABROADWITH THE ASSISTANCE AND COOPERATION OF A TRUSTED FOREIGN FIRM OR INDIVIDUALWHO WILL RECEIVE THE SAID FUND ON OUR BEHALF INTO ANY ACCOUNT PROVIDED TORECEIVE SUCH FUNDS=2E WE ARE HANDICAPPED IN THIS DEAL BECAUSE THE CIVILSERVICE CODE OF CONDUCT DOES NOT ALLOW PUBLIC SERVANTS LIKE US TO OPERATEOFFSHORE ACCOUNT=2C HENCE YOUR IMPORTANCE IN THE WHOLE TRANSACTION=2ETHE SAID AMOUNT WHICH WE HAVE GOTTEN APPROVAL TO REMIT BY TELEGRAPHICTRANSFER =28T=2ET=2E=29 TO FOREIGN BANK ACCOUNT YOU WILL PROVIDE BY FILING IN ANAPPLICATION THROUGH MY MINISTRY FOR THE TRANSFER OF RIGHT AND PRIVILEGES TOYOU=2ESINCE THE PRESENT NEW CIVILIAN GOVERNMENT OF MY COUNTRY IS DETERMINED TO PAYEVERY FOREIGN CONTRACTOR ALL DEBTS OWED SO AS TO MAINTAIN GOOD RELATIONSHIPWITH FOREIGN GOVERNMENT AND NON-GOVERNMENT FINANCIAL AGENCIES=2C WE HAVEDECIDED TO INCLUDE OUR BILL FOR APPROVALS WITH THE COOPERATION OF SOMEOFFICIALS FROM ALL THE GOVERNMENT MINISTRY WHICH WILL BE INVOLVED IN THEPAYMENT PROCESS=2E WE ARE SEEKING YOUR ASSISTANCE IN PROVIDING A VITAL ACCOUNTINTO WHICH WE CAN REMIT THIS MONEY BY ACTING AS OUR MAIN PARTNER AND TRUSTEEOR ACTING AS THE ORIGINAL CONTRACTOR=2E THIS WE CAN DO BY SWAPPING OF ACCOUNTAND CHANGING OF BENEFICIARY AND OTHER FORMS OF DOCUMENTATION UPONAPPLICATION FOR CLAIM TO REFLECT THE PAYMENT AND APPROVALS TO BE SECURED ONBEHALF OF YOU=2EI HAVE THE AUTHORITY OF MY PARTNERS INVOLVED TO PROPOSE THAT=2C SHOULD YOU BEWILLING TO ASSIST US IN THE TRANSACTION=2C YOUR SHARE OF THE SUM WILL BE 30%OF THE TOTAL SUM=2C 60% FOR US AND 10% FOR TAXATION AND MISCELLANEOUSEXPENSES=2ETHE BUSINESS IS 100% SAFE ON YOUR PART=2C BUT YOU HAVE TO KEEP ITCONFIDENTIAL=2E DO NOT INFORM YOUR BANKER YET UNLESS INSTRUCTED BY US=2E ALSO=2CYOUR AREA OF SPECIALIZATION IS NOT A HIDERANCE TO THE SUCCESSFUL EXECUTIONOF THIS TRANSACTION=2E I HAVE REPOSED MY CONFIDENCE IN YOU AND HOPE THAT YOUWILL NOT DISAPPOINT ME=2E PLEASE SEND REPLY TO ME TO INDICATE YOUR WILLINGNESSIN ASSISTING US SO THAT I WILL DIRECT YOU ON WHAT NEXT TO DO=2EINCLUDE YOURDIRECT TELEPHONE AND FAX NUMBERS IF YOU ARE RESPONDING=2ETHANKS FOR YOUR ANTICIPATED ASSISTANCE=2EYOURS SINCERELY=2CDONALD  ATTAH
  Fraud:<|im_end|>
  <|im_start|>assistant`;
        Pipeline.TextGeneration.generate(chatPrompt, setOutput);
    };

    return (
        <View>
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
        </View>
    );
};

export default HomeScreen;

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
