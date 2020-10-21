import React, { useState, useEffect, useRef } from "react";

import PoseNet from "./posenet/components/PoseNet";

import { poseSimilarity } from "./posenet_utils";

import POSE_MAP from "./data/moves"; // maps image names to pose objects.

import "./Room.css";


const SIMILARITY_THRESHOLD_EXCELLENT = 0.25;
const SIMILARITY_THRESHOLD_GOOD = 0.55;
const SIMILARITY_THRESHOLD_OKAY = 0.8;

function Room() {
  /* ============================================ INIT STATE ============================================ */

  // Game State
  const [ready, setReady] = useState(false);
  const [correctFrames, setCorrectFrames] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const imageRef = useRef();

  // TODO: handle loading of reference image poses.
  const [imageName, setImageName] = useState("tadasana.png");
  const [imagePose, setImagePose] = useState(POSE_MAP[imageName]);

  const [similarity, setSimilarity] = useState();

  /* ============================================ WEBSOCKETS ============================================ */

  // Log message output and change app state
  useEffect(() => {
    setCorrectFrames(0);
    setTotalFrames(0);
    setImageName("tadasana.png");
    setImagePose(POSE_MAP["tadasana.png"]);
  }, []);

  // Submit Score
  useEffect(() => {
    const score = Math.round((correctFrames / totalFrames) * 10000);
    console.log("scoring");
    console.log(correctFrames);
    console.log(totalFrames);
    console.log(score);
    // Should probably include round number here if we have the frame counts as dependencies
  }, [correctFrames, totalFrames]);

  /* ============================================ TWILIO ============================================ */

  /* ========================================= POSENET + SCORING ========================================= */

  const handlePose = (pose) => {
    if (!imagePose || !pose) {
      return;
    }

    // handle scoring of video pose
    const s = poseSimilarity(imagePose, pose);
    setSimilarity(s);

    // on initial pose, set ready if true.
    // exploits the fact that ready is only changed once.
    // TODO: tune threshold
    if (!ready && s < SIMILARITY_THRESHOLD_EXCELLENT) {
      setReady(true);
    }
  };

  // UpdateScore
  useEffect(() => {
    setTotalFrames(totalFrames + 1);
    if (similarity <= SIMILARITY_THRESHOLD_EXCELLENT) {
      setCorrectFrames(correctFrames + 1);
    } else if (similarity <= SIMILARITY_THRESHOLD_GOOD) {
      setCorrectFrames(correctFrames + 0.6);
    } else if (similarity <= SIMILARITY_THRESHOLD_OKAY) {
      setCorrectFrames(correctFrames + 0.3);
    } else {
      setCorrectFrames(correctFrames + 0.1);
    }
  }, [similarity, totalFrames, correctFrames]);

  /* ============================================ RENDER ============================================ */

  const DisplayScore = () => {
    let score = Math.round((1 - similarity) * 100);
    let str = null;
    let color = null;
    if (similarity <= SIMILARITY_THRESHOLD_EXCELLENT) {
      str = "Excellent!!";
      color = "#27ae60";
    } else if (similarity <= SIMILARITY_THRESHOLD_GOOD) {
      str = "Good!";
      color = "#7bed9f";
    } else if (similarity <= SIMILARITY_THRESHOLD_OKAY) {
      str = "Okay";
      color = "orange";
    } else {
      str = "Meh..";
      color = "red";
    }
    return (
      <h1 style={{ color: color }}>
        {str} {score}
      </h1>
    );
  };

  return (
    <div className="room">
      <div className="header">
        <h1 className="title display">
          <a href="/">PoseParty</a>
        </h1>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      </div>

      <div className="main-container">
        {
          <img
            className="reference-img"
            ref={imageRef}
            alt="Yoga pose to copy."
            src={`${process.env.PUBLIC_URL}/img/poses/${imageName}`}
          />
        }

        <div className="local-participant">
          <div className="video-wrapper">
            {
              <>
                <PoseNet
                  className="posenet"
                  frameRate={15}
                  // modelConfig={{
                  //   architecture: 'ResNet50',
                  //   quantBytes: 4,
                  //   outputStride: 32,
                  //   inputResolution: 193,
                  // }}
                  modelConfig={{
                    architecture: "MobileNetV1",
                    outputStride: 16,
                    multiplier: 0.75,
                  }}
                  inferenceConfig={{
                    decodingMethod: "single-person",
                    maxDetections: 1,
                  }}
                  onEstimate={(pose) => handlePose(pose)}
                  drawSkeleton={!ready}
                />
                <DisplayScore />
              </>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
export default Room;