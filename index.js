import express from "express";
import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";

const app = express();
app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));

console.log("backend! / server");

const stub = ClarifaiStub.grpc();

// Your PAT (Personal Access Token) can be found in the Account's Security section
const PAT = process.env['PAT'];
// Specify the correct user_id/app_id pairings
// Since you're making inferences outside your app's scope
const USER_ID = 'clarifai';
const APP_ID = 'main';
// Change these to whatever model and image URL you want to use
const MODEL_ID = 'general-image-detection';
const MODEL_VERSION_ID = '1580bb1932594c93b7e2e04456af7c6f';
// const IMAGE_URL = 'https://samples.clarifai.com/metro-north.jpg';

// This will be used by every Clarifai endpoint call
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + PAT);

app.post("/api/generateImage", async (req, res) => {
  let img = await req.body.img + "";
  let base64Data = img.split("base64,")[1];
  if (!base64Data) {
    return res.status(400).send("Bad encoding or no image provided");
  }
  img = base64Data;

  try {
    const response = await new Promise((resolve, reject) => {
      stub.PostModelOutputs(
          {
              user_app_id: {"user_id": USER_ID, "app_id": APP_ID},
              model_id: MODEL_ID,
              version_id: MODEL_VERSION_ID,
              inputs: [{data: {image: {base64: img, allow_duplicate_url: true}}}]
          },
          metadata,
          (err, response) => {
              if (err) {
                  reject(err);
              } 
              else if (response.status.code !== 10000) {
                  reject(new Error("Post model outputs failed, status: " + response.status.description));
              } else {
                  resolve(response);
              }
          }
      );
    });
    const regions = response.outputs[0].data.regions;
    let objectList = [];
    regions.forEach(region => {
      const boundingBox = region.region_info.bounding_box;
      const topRow = boundingBox.top_row.toFixed(3);
      const leftCol = boundingBox.left_col.toFixed(3);
      const bottomRow = boundingBox.bottom_row.toFixed(3);
      const rightCol = boundingBox.right_col.toFixed(3);
      region.data.concepts.forEach(concept => {
        const name = concept.name;
        const value = concept.value.toFixed(4);
        objectList.push({name: name, value: value});
        console.log(`${name}: ${value} BBox: ${topRow}, ${leftCol}, ${bottomRow}, ${rightCol}`);
      });
    });

    res.send({result: objectList});
    
  } catch (error) {
    console.error("Error in Clarifai API call:", error.message);
    res.status(500).send("Internal server error");
  }
});

app.listen(3000, () => {
  console.log("Express server initialized");
});
