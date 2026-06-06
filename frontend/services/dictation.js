let socket = null;
let audioContext = null;
let processor = null;
let source = null;
let stream = null;

export async function startDictation(onText){

    socket = new WebSocket("ws://localhost:8000/ws/stt");

    stream = await navigator.mediaDevices.getUserMedia({audio:true});

    audioContext = new AudioContext({sampleRate:16000});

    source = audioContext.createMediaStreamSource(stream);

    processor = audioContext.createScriptProcessor(4096,1,1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = e => {

        const input = e.inputBuffer.getChannelData(0);

        const pcm = convertFloatTo16BitPCM(input);

        if(socket.readyState === 1){
            socket.send(pcm);
        }
    };

    socket.onmessage = e => {

        const data = JSON.parse(e.data);

        if(data.type === "final"){
            onText(data.text + " ");
        }
    };
}

export function stopDictation(){

    if(processor) processor.disconnect();
    if(source) source.disconnect();

    if(stream){
        stream.getTracks().forEach(t=>t.stop());
    }

    if(socket) socket.close();
}

function convertFloatTo16BitPCM(input){

    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);

    for(let i=0;i<input.length;i++){

        let s = Math.max(-1, Math.min(1,input[i]));

        view.setInt16(i*2, s<0 ? s*0x8000 : s*0x7fff, true);
    }

    return buffer;
}
