<script lang="ts">
  import { onMount } from "svelte";
  import { fade, fly, scale } from "svelte/transition";
  import { flip } from "svelte/animate";

  let summaryStatus: "none" | "loading" | "done" = "none";
  let summary = "";

  let search = "";
  let isSearchLoading = false;
  let currName = "";
  let currCase = "";

  let currentPhone;

  let timeout = null;

  $: currentPhone, fetchSummary();
  $: console.log(headings);

  const formatPhoneNumber = (phone) => {
    let formatted = "";
    for (let i = 0; i < phone.length; i++) {
      if (phone[i].match(/\d/)) {
        formatted += phone[i];
      }
    }
    return formatted;
  };

  const fetchSummary = () => {
    if (!currentPhone) return;
    summaryStatus = "loading";
    fetch(`http://localhost:8081/client/findByPhoneNumber`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: currentPhone,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        summary = data?.[0]?.summary ?? "";
        summaryStatus = "done";
      })
      .catch(err => {
        console.log(err);
        summaryStatus = "done";
      });
  };

  interface Heading {
    name?: string;
    phone?: string;
    id: number;
    date: string;
  }
  let headings: Heading[] = [];
  const unshiftHeading = (heading: Heading) => {
    headings.unshift(heading);
    headings = headings;
    localStorage.setItem("headings", JSON.stringify(headings));
  };

  interface SearchResults {
    filename: string;
    summary: string;
    link: string;
  }
  let searchResults: SearchResults[] = [];

  onMount(() => {
    headings = JSON.parse(localStorage.getItem("headings")) || [];
    let socket = new WebSocket("ws://localhost:1234");
    socket.addEventListener("open", () => {
      console.log("WebSocket connected");
    });
    socket.addEventListener("error", (event) => {
      console.log("WebSocket error: ", event);
      console.log("Attempting to reconnect...");
      setTimeout(() => {
        socket = new WebSocket("ws://localhost:1234");
      }, 2000);
    });
    socket.addEventListener("message", (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      console.log(data);
      switch (data.type) {
        case "newphonecall":
          new Notification(`Incoming phone call`, {
            body: data.phone,
          });
          unshiftHeading({ phone: data.phone, id: Math.random(), date: new Date().toLocaleString() });
          currentPhone = formatPhoneNumber(data.phone);
          break;
        case "summary":
          summary = data.summary;
          summaryStatus = "done";
          break;
        case "name":
          headings.at(-1).name = data.name;
          summaryStatus = "done";
          break;
        case "transcript":
          console.log
          summary = data.transcript.text;
          break;
        default:
          console.log("this is bad");
      }
    });
  });
</script>

<div class="flex flex-col items-center">
  <div class="bg-black w-full flex justify-center mb-4">
    <img
      on:click={() => unshiftHeading({ name: "bob", phone: "1234567890", id: Math.random(), date: new Date().toLocaleString() })}
      src="/MnMLogoSmall.png"
      class="w-1/4 py-4"
    />
  </div>

  <div class="flex flex-row justify-center gap-20">
    <div>
      <div
        transition:fly={{ y: 100, duration: 1000 }}
        class="text-white-500 border border-slate-300 w-96 h-[80vh] max-h-[80vh] rounded-lg shadow-lg overflow-y-scroll"
      >
        <div class="p-6 flex flex-col gap-4">
          <input
            class="bg-white border outline-none text-grey border-gray-300 text-1xl
            hover:bg-transparent px-4 py-3 w-full placeholder:text-gray-500
            rounded-lg focus:border-gray-500 focus:shadow transition-all"
            placeholder="Search..."
            on:input={() => {
              clearTimeout(timeout);
              console.log("hi");
              isSearchLoading = true;
              timeout = setTimeout(() => {
                isSearchLoading = false;
                fetch(`http://localhost:8081/client/queryBySummary`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    search,
                  }),
                })
                  .then((res) => res.json())
                  .then((res) => {
                    console.log(res);
                    searchResults = res;
                  });
              }, 1000);
            }}
            bind:value={search}
          />
          {#if isSearchLoading}
            <div class="flex justify-center mt-16">
              <img in:fade src="/robotLogoLoad.gif" alt="" class="h-20 mb-8">
            </div>
          {:else}
            {#if searchResults.length === 0}
                <div class="flex flex-col justify-center items-center mt-8">
                  <div>No results found!</div>
                  <img in:fade src="/robotLogo.png" alt="" class="h-20 mb-8">
                </div>
            {/if}
            {#each searchResults as result}
              <div transition:fade>
                <a class="flex items-center gap-2 hover:underline hover:cursor-pointer" href={result.link}>
                  <span class="font-bold font-mono text-lg"
                    >{result.filename}</span
                  >
                  <img class="h-6 inline-block" src="/docxRob.png" />
                </a>
                <div>{result.summary ?? ""}</div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
    <div class="flex flex-col items-center justify-center">
      <div class="flex flex-col items-center justify-center w-96 relative">
          {#if summaryStatus === "done"}
          <div
            in:fade
            class="flex flex-col pt-8 px-4 items-center text-white-500 border h-[80vh] max-h-[80vh] overflow-y-scroll border-slate-300 w-full rounded-lg gap-4 shadow-lg"
          >
            <h2 class="flex justify-center text-4xl">Summary</h2>
            <p class="flex justify-center m-3">{summary}</p>
          </div>
          {/if}
          {#if summaryStatus !== "done"}
            <div in:fade class="contents">
              <img in:fade src="/robotLogoLoad.gif" alt="" class="mb-8">
            </div>
          {/if}
      </div>
    </div>
    <div>
      <div class="flex justify-center w-96">
        <div
          transition:fly={{ y: 100, duration: 1000 }}
          class="flex flex-col pt-8 px-4 text-white-500 border border-slate-300 w-full h-[80vh] overflow-y-scroll rounded-lg gap-4 shadow-lg"
        >
          <h2 class="flex justify-center text-4xl">Client Calls</h2>
          {#each headings as heading (heading.id)}
            <button animate:flip={{ duration: 400 }} transition:scale
              on:click={() => {
                currentPhone = formatPhoneNumber(heading.phone);
                console.log(currentPhone);
              }}
              class="bg-[#115099] rounded-lg py-2 m-2 text-white hover:bg-blue-950">
              {#if heading.name}
                <span class="mr-4">{heading.name}</span>
              {/if}
              <span>{heading.phone}</span>
              <span>{new Date(heading.date).toLocaleTimeString()}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!--
<button
on:click={() => {
Notification.requestPermission();
}}
class={`bg-black border text-white border-black text-2xl
hover:bg-transparent hover:text-black px-5 py-3
rounded-lg drop-shadow-lg transition-all 
`}
>
<span class="mr-2">Rob</span><span>case 452</span>
</button>
-->
  </div>
</div>
