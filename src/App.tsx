import io from "socket.io-client";

const socket = io();

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectGroup,
  SelectValue,
} from "./components/ui/select";
import { BoxState, SAAL_BOX } from "./state";
import { cn } from "./lib/utils";
import { Button } from "./components/ui/button";
import { StopWatch } from "./StopWatch";

const BoxSelectItems = (
  <SelectGroup>
    <SelectLabel>Bitte auswählen</SelectLabel>
    <SelectItem value="Schritt vorzeigen">Schritt vorzeigen</SelectItem>
    <SelectItem value="Frage">Frage</SelectItem>
    <SelectItem value="Patient entlassen">Patient entlassen</SelectItem>
    <SelectItem value="sonstiges">Sonstiges</SelectItem>
  </SelectGroup>
);

const Box = (props: {
  num: number;
  state: null | BoxState;
  activeBox: string;
  onStateChange: (state: BoxState) => void;
  onCancel: () => void;
  saal: BoxState["saal"];
}) => {
  const isSelf = props.num.toString() == props.activeBox;

  const selectionMade = (value: string, abteilung: "zko" | "zpr") => {
    const schritt =
      value == "sonstiges"
        ? prompt("Um was geht es?", "Sonstiges") || "Sonstiges"
        : value;
    const state: BoxState = {
      abteilung,
      box: props.activeBox,
      schritt,
      timestamp: new Date(),
      saal: props.saal,
    };

    props.onStateChange(state);
  };

  const { state } = props;

  return (
    <div
      className={cn("border", {
        "bg-yellow-300": state?.abteilung === "zko",
        "bg-blue-400": state?.abteilung === "zpr",
      })}
    >
      <div
        className={cn("text-center text-lg border-b-2 bg-black bg-opacity-10", {
          "font-bold": isSelf,
        })}
      >
        Box {props.num}
      </div>
      <div className="h-28 flex break-all">
        <div className="content m-auto">
          {state && (
            <div className="text-center">
              <div className="font-bold">{state.schritt}</div>
              <div>
                <StopWatch since={state.timestamp}></StopWatch>
              </div>
              {(isSelf || props.activeBox == "99") && (
                <Button
                  size="xs"
                  onClick={() => {
                    props.onCancel();
                  }}
                >
                  Austragen
                </Button>
              )}
            </div>
          )}

          {isSelf && props.state == null && (
            <div>
              <Select onValueChange={(e) => selectionMade(e, "zko")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ZKO" />
                </SelectTrigger>
                <SelectContent>{BoxSelectItems}</SelectContent>
              </Select>
              <Select onValueChange={(e) => selectionMade(e, "zpr")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ZPR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectContent>{BoxSelectItems}</SelectContent>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [box, setBox] = useState(() => {
    return "99";
  });
  const [saal, setSaal] = useState<BoxState["saal"]>(() => {
    //return prompt("Box Nummer");
    return "a2";
  });

  useEffect(() => {
    setBox(prompt("Box Nummer")!);
    //setBox("11");
  }, [saal]);

  const [saalState, setSaalState] = useState<BoxState[]>([]);

  useEffect(() => {
    // Listen for incoming messages
    socket.on("update", (stateUpdate) => {
      console.log("Socket: ", stateUpdate);

      setSaalState(stateUpdate);
    });
  }, []);

  return (
    <>
      <div className="container">
        <div className="text-lg font-bold my-5">
          Wartezimmer
          <Select
            value={saal}
            onValueChange={(e) => setSaal(e as BoxState["saal"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="ZKO" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a1">Saal A1</SelectItem>
              <SelectItem value="a2">Saal A2</SelectItem>
              <SelectItem value="b1">Saal B1</SelectItem>
              <SelectItem value="b2">Saal B2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {SAAL_BOX[saal].map((num) => {
            return (
              <Box
                key={num}
                num={num}
                saal="a2"
                activeBox={box!}
                state={
                  saalState.filter(
                    (s) => s.box == num.toString() && s.saal == saal
                  )[0]
                }
                onCancel={() => {
                  setSaalState((prev) => {
                    return prev.filter((s) => s.box != num.toString());
                  });
                  socket.emit("cancel", { saal, box: num.toString() });
                }}
                onStateChange={(state) => {
                  setSaalState((prev) => {
                    const newState = [
                      ...prev.filter((s) => s.box != state.box),
                    ];
                    socket.emit("update", state);
                    newState.push(state);
                    return newState;
                  });

                  console.log(state);
                }}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

export default App;
