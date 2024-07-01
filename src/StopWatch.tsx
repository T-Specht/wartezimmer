import { useState } from "react";
import { useInterval } from "usehooks-ts";
import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
import "dayjs/locale/de";
dayjs.locale("de");
dayjs.extend(relativeTime);

export const StopWatch = (props: { since: Date }) => {
  const [key, setKey] = useState(0);
  useInterval(() => {
    setKey((prev) => prev + 1);
  }, 10);

  const duration = dayjs().diff(props.since, "second");
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <div key={key} className="font-mono">{`${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`}</div>
  );
};
