import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const onMount = (func: () => void) => {
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) {
            func();
            isMounted.current = true;
        }
    }, []);
};

const defaultSummary = `The Casey Anthony case is a high-profile criminal case that took place in the United States in 2011. 
Casey Anthony was a 25-year-old mother from Florida who was accused of murdering her two-year-old daughter, 
Caylee Anthony. The case received widespread media coverage and captivated the nation due to the gruesome nature 
of the crime and the conflicting evidence presented in court.`;

const client = "Casey Anthony";

function App() {
    const [summary, setSummary] = useState("");
    const [summaryStatus, setSummaryStatus] = useState("none");
    onMount(() => {
        const socket = new WebSocket("ws://localhost:1234"); socket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            console.log(data);
            switch (data.type) {
                case "newphonecall":
                    new Notification('New message from Rob', {
                        body: 'Case 452',
                    });
                    setSummaryStatus("loading");
                    break;
                case "summary":
                    setSummary(data.summary);
                    setSummaryStatus("done");
                    break;
            }
        })
    });
    return (
        <div className="flex flex-col items-center">
            <div className="bg-black w-full flex justify-center mb-4">
                <img src="/MnMLogoSmall.png" className="w-1/4 py-4" />
            </div>

            <div className="flex flex-col justify-center mb-4 gap-2">
                <h2>incoming calls:</h2>
                {/* when no call is received the text box should be replaced with a "no active calls" and when one is received but is loading, display a loading animation*/}
                <div className="flex justify-center">
                    {summaryStatus === "done" &&
                        <motion.div className='flex-row text-white-500 border-2 bg-slate-200 border-blue-200 w-96 h-auto rounded-lg gap-4'>
                            <h2 className='ml-4'>Client: {client}</h2>
                            <p className='mx-4 my-4'>{summary}</p>
                        </motion.div>
                    }
                    {summaryStatus === "loading" &&
                    <div className="w-min">
                        <svg className="animate-spin h-10 w-10 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    }
                </div>
            </div>

            <button
                onClick={() => {
                    Notification.requestPermission()
                }}
                className={`bg-black border text-white border-black text-2xl
hover:bg-transparent hover:text-black px-5 py-3
rounded-lg drop-shadow-lg transition-all 
`}
            >
                <span className="mr-2">Rob</span><span>case 452</span>
            </button>
        </div>
    )
}

export default App
