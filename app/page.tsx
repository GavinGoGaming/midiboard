"use client";
import { Button, CssVarsProvider } from "@mui/joy";
import { useEffect, useState } from "react";
import Grid from "./Grid";

export default function Home() {
  const [devices, setDevices] = useState<MIDIInput[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MIDIInput | null>(null);
  const [tileMappings, setTileMappings] = useState<Record<number, string>>({});

  const [audios, setAudios] = useState<HTMLAudioElement[]>([]);

  function onMessage(_: MIDIInput, event: MIDIMessageEvent) {
    if (!event.data) return;
    const data = {
      note: event.data[1],
      heldAmount: event.data[2],
      command: event.data[0] >> 4,
    };
    if (data.heldAmount === 0) return;

    setTileMappings((prevMappings) => {
      console.log(prevMappings);
      const audioFile = prevMappings[data.note];
      if (audioFile) {
        const audio = new Audio(audioFile);
        setAudios((prevAudios) => [...prevAudios, audio]);
        audio.play();
      }
      return prevMappings;
    });
  }

  useEffect(() => {
    navigator.requestMIDIAccess().then((access) => {
      const inputs = access.inputs.values();
      const devices = [];
      for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        devices.push(input.value);
        input.value.onmidimessage = onMessage.bind(null, input.value);
      }
      setDevices(devices);
    });
  }, []);

  const handleTileClick = (id: number) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "audio/mp3";
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const audioUrl = reader.result as string;
          setTileMappings((prevMappings) => ({
            ...prevMappings,
            [id]: audioUrl,
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const saveJSON = () => {
    const blob = new Blob([JSON.stringify(tileMappings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tileMappings.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadJSON = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const mappings = JSON.parse(reader.result as string);
          setTileMappings(mappings);
        };
        reader.readAsText(file);
      }
    };
    fileInput.click();
  };

  const grid = Grid(handleTileClick, tileMappings);

  return (
    <CssVarsProvider defaultMode="dark">
      <div className="main">
        {selectedDevice ? (
          <>
            <Button onClick={saveJSON}>Save Mappings</Button>
            <Button onClick={loadJSON}>Load Mappings</Button>
            <Button onClick={() => setSelectedDevice(null)}>Back</Button>
            <div>Selected Device: {selectedDevice.name}</div>
            {grid.element}
          </>
        ) : (
          devices.map((d) => (
            <Button
              key={d.id}
              onClick={() => {
                setSelectedDevice(d);
              }}
            >
              {d.name}
            </Button>
          ))
        )}
      </div>
    </CssVarsProvider>
  );
}
