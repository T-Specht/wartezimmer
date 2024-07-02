import io from "socket.io-client";

const socket = io(import.meta.env.DEV ? "http://localhost:3001" : "/");

function clamp(val: number, min: number, max: number) {
  return val > max ? max : val < min ? min : val;
}

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  // SelectLabel,
  SelectItem,
  SelectGroup,
  SelectValue,
} from "./components/ui/select";
import { BoxState, SAAL_BOX } from "./state";
import { cn } from "./lib/utils";
import { Button } from "./components/ui/button";
import { StopWatch } from "./StopWatch";
import { useLocalStorage } from "usehooks-ts";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

const BoxSelectItems = (
  <SelectGroup>
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
  const isSelfOrAdmin =
    props.num.toString() == props.activeBox || props.activeBox == "99";

  const selectionMade = (value: string, abteilung: "zko" | "zpr") => {
    const schritt =
      value == "sonstiges"
        ? prompt("Um was geht es?", "Sonstiges") || "Sonstiges"
        : value;
    const state: BoxState = {
      abteilung,
      box: props.num.toString(),
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
          "font-bold": isSelfOrAdmin,
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
              {isSelfOrAdmin && (
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

          {isSelfOrAdmin && props.state == null && (
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
  const [zoom, setZoom] = useLocalStorage("zoom", () => {
    return 1;
  });
  const [box, setBox] = useLocalStorage("box", () => {
    return "";
  });

  const [notfications, setNotifications] = useLocalStorage(
    "notifications",
    () => {
      return "none";
    }
  );

  const [notificationPermission, setNotificationPermission] = useState(false);

  const [saal, setSaal] = useLocalStorage<BoxState["saal"]>("saal", () => {
    //return prompt("Box Nummer");
    return "a1";
  });

  const [isFirstStateUpdate, setIsFirstStateUpdate] = useState(true);

  useEffect(() => {
    if (
      (notfications == "zko" || notfications == "zpr") &&
      !notificationPermission
    ) {
      Notification.requestPermission().then((result) => {
        if (result == "granted") {
          setNotificationPermission(true);
        } else {
          alert("Keine Erlaubnis, Benachrichtigungen zu senden.");
          setNotificationPermission(false);
        }
      });
    }
  }, [notfications, notificationPermission]);

  // useEffect(() => {
  //   setBox(prompt("Box Nummer (99 als Saalbetreuer)")!);
  //   //setBox("11");
  // }, [saal]);

  const [saalState, setSaalState] = useState<BoxState[]>([]);

  useEffect(() => {
    // Listen for incoming messages

    socket.on("update", (stateUpdate: BoxState[]) => {
      console.log("Socket: ", stateUpdate);

      // Filter for changes to current state
      const changes = stateUpdate.filter(
        (state) =>
          !saalState.some((s) => s.box === state.box && s.saal === state.saal)
      );

      // Send notification for each change if enabled and permission granted
      for (const c of changes) {
        if (
          notfications == c.abteilung &&
          saal == c.saal &&
          notificationPermission &&
          !isFirstStateUpdate
        ) {
          const n = new Notification(`Box ${c.box}`, {
            body: c.schritt,
          });

          setTimeout(() => {
            n.close();
          }, 3000);
        }
      }

      if (isFirstStateUpdate) {
        setIsFirstStateUpdate(false);
      }

      setSaalState(stateUpdate);
    });

    return () => {
      socket.removeAllListeners("update");
    };
  }, [
    notfications,
    saalState,
    notificationPermission,
    isFirstStateUpdate,
    saal,
  ]);

  useEffect(() => {
    document.body.style.setProperty("zoom", clamp(zoom, 0.4, 4).toString());
  }, [zoom]);

  return (
    <>
      <div className="container">
        <div className="my-5">
          <div className="text-lg font-bold my-2">
            <h1>Wartezimmer</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="grid items-center gap-1.5  w-full">
              <Label>Saal</Label>
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
            <div className="grid items-center gap-1.5  w-full">
              <Label>Eigene Box</Label>
              <Input
                placeholder="Box Nummer (99 als Betreuer)"
                autoFocus={box == ""}
                onChange={(e) => setBox(e.target.value)}
                type="number"
                className={cn({ "bg-red-200": box == "" })}
                value={box}
              ></Input>
            </div>
            <div className="grid items-center gap-1.5  w-full">
              <Label>Zoom Faktor</Label>
              <Input
                placeholder="Zoomfaktor"
                min={0.2}
                max={10}
                step={0.1}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                type="number"
                value={zoom}
              ></Input>
            </div>
            {box == "99" && (
              <div className="grid items-center gap-1.5  w-full">
                <Label>Benachrichtungen</Label>
                <Select
                  value={notfications}
                  onValueChange={(e) => setNotifications(e)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Benachrichtungen aktivieren" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Benachrichtungen</SelectItem>
                    <SelectItem value="zko">
                      ZKO {!notificationPermission && "(keine Berechtigung)"}
                    </SelectItem>
                    <SelectItem value="zpr">
                      ZPR {!notificationPermission && "(keine Berechtigung)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {SAAL_BOX[saal].map((num) => {
            return (
              <Box
                key={num}
                num={num}
                saal={saal}
                activeBox={box!}
                state={
                  saalState.find(
                    (s) => s.box == num.toString() && s.saal == saal
                  ) || null
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

        <div className="mt-20 opacity-65">
          <a href="https://github.com/T-Specht/wartezimmer" target="_blank">
            Der Quellcode ist unter{" "}
            <span className="font-mono">
              https://github.com/T-Specht/wartezimmer
            </span>{" "}
            öffentlich einsehbar und verfügbar.
          </a>
        </div>
      </div>
    </>
  );
}

export default App;
