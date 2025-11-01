import { worker, type PlayPauseMsg, type WorkerMsg, type ReplayMsg, type VideoFileMsg } from "../workerMsg"
import styles from './controls.module.css';
import { useCallback, useMemo } from "react";

export interface VideoControlProps {
  msg: WorkerMsg;
  text: string;
}

const VideoControl: React.FC<VideoControlProps> = ({ msg, text }) => {
  const onClick = useCallback(() => {
    worker?.deref?.postMessage(msg)
  }, [msg])

  return <>
    <button onClick={onClick} className={styles.button}>
      {text}
    </button></>
}

export const PlayPause: React.FC = () => {
  const msg: PlayPauseMsg = useMemo(() => {
    return { type: 'PlayPause', data: null }
  }, []);
  return <VideoControl msg={msg} text={"⏯"} />
}

export const Replay: React.FC = () => {
  const msg: ReplayMsg = useMemo(() => {
    return { type: 'Replay', data: null }
  }, []);

  return <VideoControl msg={msg} text="Replay" />
}

export const SelectVideo: React.FC = () => {
  const onSelectFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const videoFiles = e.target.files;
      if (!videoFiles || videoFiles.length === 0) {
        return;
      }
      const videoFile = videoFiles[0];
      const msg: VideoFileMsg = { type: 'Video', data: videoFile };
      worker?.deref?.postMessage(msg);
    },
    []
  );

  return <>
    <label htmlFor="input" className={styles.button}>
      Select Video
    </label>
    <input
      id="input"
      type="file"
      accept="video/*"
      onChange={onSelectFile}
      style={{ display: 'none' }}
    />
  </>
}