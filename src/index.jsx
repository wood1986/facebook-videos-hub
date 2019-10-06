/* eslint-disable max-lines-per-function */
import React, {useCallback, useEffect, useRef, useState} from "react";
import styled, {createGlobalStyle} from "styled-components";
import ReactDOM from "react-dom";

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
  }

  body {
    background-color: black;
  }

  #root {
    position: relative;
  }
`,
      WIDTH = Math.min(480, window.innerWidth),
      InputWidth = 30,
      search = new URLSearchParams(window.location.search),
      videosFromLocalStorage = (window.localStorage.getItem("videos") || "").split(",").filter(Boolean),
      videosFromSearch = (search.get("videos") || "").split(",").filter(Boolean),
      videos = new Set([...videosFromLocalStorage, ...videosFromSearch].
        map((url) => new URL(url.replace(/\/+$/u, ""), "https://www.facebook.com").pathname)),
      VideoWrapper = styled.div`
        display: inline-block;
        float: left;
        min-height: ${WIDTH * 9 / 16.0}px;
        min-width: ${WIDTH}px;
        overflow: hidden;
        position: relative;
      `,
      DeleteButton = styled.button`
        background-color: transparent;
        border: none;
        font-size: 10px;
        height: 24px;
        opacity: 0.5;
        padding: 0;
        width: 24px;
        :hover {
          opacity: 1;
        }
      `,
      FixedDiv = styled.div`
        bottom: 0;
        box-sizing: border-box;
        display: flex;
        opacity: 0.8;
        padding: ${InputWidth >> 2}px;
        position: fixed;
        width: 100%;
      `,
      EmptyButton = styled.button`
        background: transparent;
        border: 0;
        font-size: 15px;
        height: ${InputWidth}px;
        margin: ${InputWidth >> 2}px;
        padding: 0;
        width: ${InputWidth}px;
      `,
      Input = styled.input.attrs(() => ({
        "placeholder": "https://www.facebook.com/<pageId>/videos/<videoId> is the valid format. This input box is for touch-to-paste. If you are using Desktop, you can just directly press 'Ctrl' + 'V' anywhere on the page."
      }))`
        background: white;
        border: 0;
        border-radius: ${InputWidth >> 1}px;
        bottom: 0;
        box-sizing: border-box;
        flex-grow: 1
        font-family: system-ui, BlinkMacSystemFont, 'Roboto', arial, sans-serif;
        font-size: 14px;
        height: ${InputWidth}px;
        line-height: ${InputWidth}px;
        margin: ${InputWidth >> 2}px;
        padding: 0 ${InputWidth >> 1}px;
        width: 100%;
      `,
      ControlFlexBox = styled.div`
        display: flex;
        height: 24px;
        position: absolute;
        width: ${WIDTH}px;
        top: 0;
      `,
      FlexBoxGrow = styled.div`
        flex-grow:1
      `,
      ClearDiv = styled.div`
        clear: both
      `,
      Hub = (props) => {
        const [videos, setVideos] = useState(props.videos), // eslint-disable-line react/prop-types, no-shadow
              lastUpdatedAt = useRef(0),
              [enableLiveJson, setEnableLiveJson] = useState(true),
              inputEl = useRef(null),
              onDeleteClick = useCallback((video) => () => {
                const nextVideos = new Set(videos);
                nextVideos.delete(video);
                setVideos(nextVideos);
                lastUpdatedAt.current = Date.now();
              }, [videos]),
              onEmptyClick = useCallback(() => {
                videos.clear();
                setVideos(new Set());
                lastUpdatedAt.current = 0;
              }, [videos]),
              Videos = Array.from(videos).map((video) => {
                const url = new URL(video, "https://www.facebook.com");
                return <VideoWrapper key={`${video}`}>
                  <div id={video} className="fb-video"
                    data-href={url.href} data-show-captions={true}
                    data-allowfullscreen={false} data-width={WIDTH} data-autoplay={true} ></div>
                  <ControlFlexBox>
                    <FlexBoxGrow />
                    <DeleteButton onClick={onDeleteClick(video)}>❌</DeleteButton>
                  </ControlFlexBox>
                </VideoWrapper>;
              }),
              onLiveJsonChange = useCallback(() => {
                setEnableLiveJson(!enableLiveJson);
              }),
              addVideos = useCallback((array) => {
                const nextVideos = array.map((video) => new URL(video.replace(/\/+$/u, ""), "https://www.facebook.com")).
                  filter((video) => video.pathname !== "/" && !videos.has(video.pathname)).
                  reduce((acc, video) => {
                    acc.add(video.pathname);
                    return acc;
                  }, new Set([...videos]));
                if (videos.size !== nextVideos.size) {
                  setVideos(nextVideos);
                  lastUpdatedAt.current = Date.now();
                }
              }, [videos]),
              fetchLiveJson = useCallback(() => {
                fetch("https://raw.githubusercontent.com/facebook-videos-hub/live-videos-payload/master/live.json").
                  then((res) => res.json()).
                  then((json) => {
                    if (json.runAt > lastUpdatedAt.current) {
                      addVideos(json.videos);
                    }
                  });
              });

        useEffect(() => {
          const intervalId = -1;
          if (enableLiveJson) {
            fetchLiveJson();
            setInterval(fetchLiveJson, 15000);
          }

          return () => {
            clearInterval(intervalId);
          };
        }, [enableLiveJson]);

        useEffect(() => {
          window.FB.XFBML.parse();
          window.localStorage.setItem("videos", Array.from(videos).join(","));
          window.history.replaceState("", document.title, `?videos=${Array.from(videos).join(",")}`);

          const onPaste = (event) => {
            const text = event.clipboardData.getData("text");
            addVideos([text]);
          };

          window.addEventListener("paste", onPaste);
          return () => {
            window.removeEventListener("paste", onPaste);
          };
        });

        return <>
          <div>{Videos}<ClearDiv/></div>
          <FixedDiv>
            <Input ref={inputEl} onPaste={() => {
              setTimeout(() => {
                inputEl.current.value = "";
              }, 100);
            }} />
            { videos.size > 0 ? <EmptyButton onClick={onEmptyClick}>🈳</EmptyButton> : null }
            <EmptyButton onClick={onLiveJsonChange}>{ enableLiveJson ? "⏹" : "🔄"}</EmptyButton>
          </FixedDiv>
        </>;
      };

ReactDOM.render(<><GlobalStyle /><Hub videos={videos} /></>, document.getElementById("root"));
