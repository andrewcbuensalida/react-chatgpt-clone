import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react';
import { BiPlus, BiUser, BiSend, BiSolidUserCircle } from 'react-icons/bi';
import { MdOutlineArrowLeft, MdOutlineArrowRight } from 'react-icons/md';

function App() {
  const [text, setText] = useState('');
  const [message, setMessage] = useState(null);
  const [previousChats, setPreviousChats] = useState([]);
  const [chatsToday, setChatsToday] = useState([]);
  const [currentTitle, setCurrentTitle] = useState(null);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isShowSidebar, setIsShowSidebar] = useState(false);
  const scrollToLastItem = useRef(null);

  const createNewChat = () => {
    setMessage(null);
    setText('');
    setCurrentTitle(null);
  };

  const backToHistoryPrompt = (uniqueTitle) => {
    setCurrentTitle(uniqueTitle);
    setMessage(null);
    setText('');
  };

  const toggleSidebar = useCallback(() => {
    setIsShowSidebar((prev) => !prev);
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!text) return;

    setIsResponseLoading(true);
    setErrorText('');

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': import.meta.env.VITE_AUTH_TOKEN,
      },
      body: JSON.stringify({
        message: text,
      }),
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/completions`,
        options
      );

      if (response.status === 429) {
        return setErrorText('Too many requests, please try again later.');
      }

      const data = await response.json();

      if (data.error) {
        setErrorText(data.error.message);
        setText('');
      } else {
        setErrorText(false);
      }

      if (!data.error) {
        setErrorText('');
        setMessage(data.choices[0].message);
        setTimeout(() => {
          scrollToLastItem.current?.lastElementChild?.scrollIntoView({
            behavior: 'smooth',
          });
        }, 1);
        setTimeout(() => {
          setText('');
        }, 2);
      }
    } catch (e) {
      setErrorText(e.message);
      console.error(e);
    } finally {
      setIsResponseLoading(false);
    }
  };

  useLayoutEffect(() => {
    const handleResize = () => {
      setIsShowSidebar(window.innerWidth <= 640);
    };
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!currentTitle && text && message) {
      setCurrentTitle(text);
    }

    if (currentTitle && text && message) {
      const newChat = {
        title: currentTitle,
        role: 'user',
        content: text,
      };

      const responseMessage = {
        title: currentTitle,
        role: message.role,
        content: message.content,
      };

      setPreviousChats((prevChats) => [...prevChats, newChat, responseMessage]);
      setChatsToday((prevChats) => [...prevChats, newChat, responseMessage]);
    }
  }, [message, currentTitle]);

  const currentChat = (chatsToday || previousChats).filter(
    (prevChat) => prevChat.title === currentTitle
  );

  return (
		<>
			<div className="container">
				<section className={`sidebar ${isShowSidebar ? "open" : ""}`}>
					<div
						className="sidebar-header"
						onClick={createNewChat}
						role="button"
					>
						<BiPlus size={20} />
						<button>New Chat</button>
					</div>
					<div className="sidebar-history">
						{chatsToday.length !== 0 && (
							<>
								<p>Ongoing</p>
								<ul>
									{chatsToday?.map((chat, idx) => {
										const listItems =
											document.querySelectorAll("li");

										listItems.forEach((item) => {
											if (
												item.scrollWidth >
												item.clientWidth
											) {
												item.classList.add(
													"li-overflow-shadow"
												);
											}
										});

										return (
											<li
												key={idx}
												onClick={() =>
													backToHistoryPrompt(chat)
												}
											>
												{chat}
											</li>
										);
									})}
								</ul>
							</>
						)}
						{previousChats.length !== 0 && (
							<>
								<p>Previous</p>
								<ul>
									{previousChats?.map((chat, idx) => {
										const listItems =
											document.querySelectorAll("li");

										listItems.forEach((item) => {
											if (
												item.scrollWidth >
												item.clientWidth
											) {
												item.classList.add(
													"li-overflow-shadow"
												);
											}
										});

										return (
											<li
												key={idx}
												onClick={() =>
													backToHistoryPrompt(
														chat
													)
												}
											>
												{chat}
											</li>
										);
									})}
								</ul>
							</>
						)}
					</div>
					<div className="sidebar-info">
						<div className="sidebar-info-upgrade">
							<BiUser size={20} />
							<p>Upgrade plan</p>
						</div>
						<div className="sidebar-info-user">
							<BiSolidUserCircle size={20} />
							<p>User</p>
						</div>
					</div>
				</section>

				<section className="main">
					{!currentTitle && (
						<div className="empty-chat-container">
							<img
								src="images/chatgpt-logo.svg"
								width={45}
								height={45}
								alt="ChatGPT"
							/>
							<h1>Chat GPT Clone</h1>
							<h3>How can I help you today?</h3>
						</div>
					)}

					{isShowSidebar ? (
						<MdOutlineArrowRight
							className="burger"
							size={28.8}
							onClick={toggleSidebar}
						/>
					) : (
						<MdOutlineArrowLeft
							className="burger"
							size={28.8}
							onClick={toggleSidebar}
						/>
					)}
					<div className="main-header">
						<ul>
							{currentChat?.map((chatMsg, idx) => {
								const isUser = chatMsg.role === "user";

								return (
									<li key={idx} ref={scrollToLastItem}>
										{isUser ? (
											<div>
												<BiSolidUserCircle
													size={28.8}
												/>
											</div>
										) : (
											<img
												src="images/chatgpt-logo.svg"
												alt="ChatGPT"
											/>
										)}
										{isUser ? (
											<div>
												<p className="role-title">
													You
												</p>
												<p>{chatMsg.content}</p>
											</div>
										) : (
											<div>
												<p className="role-title">
													ChatGPT
												</p>
												<p>{chatMsg.content}</p>
											</div>
										)}
									</li>
								);
							})}
						</ul>
					</div>
					<div className="main-bottom">
						{errorText && <p className="errorText">{errorText}</p>}
						{errorText && (
							<p id="errorTextHint">
								*You can clone the repository and use your paid
								OpenAI API key to make this work.
							</p>
						)}
						<form
							className="form-container"
							onSubmit={submitHandler}
						>
							<input
								type="text"
								placeholder="Send a message."
								spellCheck="false"
								value={
									isResponseLoading ? "Processing..." : text
								}
								onChange={(e) => setText(e.target.value)}
								readOnly={isResponseLoading}
							/>
							{!isResponseLoading && (
								<button type="submit">
									<BiSend size={20} />
								</button>
							)}
						</form>
						<p>
							ChatGPT can make mistakes. Consider checking
							important information.
						</p>
					</div>
				</section>
			</div>
		</>
  );
}

export default App;
