'use client';
import { Box, Button, Stack, TextField, MenuItem, Select, FormControl, InputLabel, IconButton, List, ListItem, ListItemText, Input, Typography } from "@mui/material";
import { ThumbUp, ThumbDown } from '@mui/icons-material';
import { useState, useEffect } from "react";

export default function Home() { 
  const [chats, setChats] = useState(() => {
    const savedChats = localStorage.getItem('chats');
    return savedChats ? JSON.parse(savedChats) : [{
      id: 1,
      name: 'Chat 1',
      messages: [{
        role: 'assistant',
        content: `Hi, I am CodeMentor, how may I assist you today?`,
      }],
    }];
  });

  const [currentChatId, setCurrentChatId] = useState(chats[0].id);
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('English');
  const [feedback, setFeedback] = useState({});

  const [editingChatId, setEditingChatId] = useState(null);
  const [editingChatName, setEditingChatName] = useState('');

  const currentChat = chats.find(chat => chat.id === currentChatId);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const handleThumbClick = (messageIndex, type) => {
    setFeedback((prevFeedback) => ({
      ...prevFeedback,
      [currentChatId]: {
        ...prevFeedback[currentChatId],
        [messageIndex]: type,
      },
    }));
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = { role: "user", content: message };

    setChats((prevChats) =>
      prevChats.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, newMessage, { role: 'assistant', content: '' }] }
          : chat
      )
    );

    setMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: [...currentChat.messages, newMessage], language }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      const processText = async ({ done, value }) => {
        if (done) return result;

        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        result += text;

        setChats((prevChats) =>
          prevChats.map(chat =>
            chat.id === currentChatId
              ? {
                ...chat,
                messages: chat.messages.map((msg, index) =>
                  index === chat.messages.length - 1 ? { ...msg, content: result } : msg
                ),
              }
              : chat
          )
        );

        return reader.read().then(processText);
      };

      await reader.read().then(processText);
    } catch (error) {
      console.error('Error sending message:', error);
      setChats((prevChats) =>
        prevChats.map(chat =>
          chat.id === currentChatId
            ? {
              ...chat,
              messages: chat.messages.map((msg, index) =>
                index === chat.messages.length - 1 ? { ...msg, content: "Sorry, something went wrong. Please try again." } : msg
              ),
            }
            : chat
        )
      );
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  };

  const deleteChat = (chatId) => {
    setChats((prevChats) => prevChats.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId && chats.length > 1) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setCurrentChatId(remainingChats[0].id);
    } else if (chats.length === 1) {
      setChats([]);
      setCurrentChatId(null);
    }
  };

  const createNewChat = () => {
    const newChatId = chats.length > 0 ? chats[chats.length - 1].id + 1 : 1;
    setChats([...chats, {
      id: newChatId,
      name: `Chat ${newChatId}`,
      messages: [{
        role: 'assistant',
        content: `Hi, I am CodeMentor, how may I assist you today?`,
      }],
    }]);
    setCurrentChatId(newChatId);
  };

  const switchChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  const startRenamingChat = (chatId, currentName) => {
    setEditingChatId(chatId);
    setEditingChatName(currentName);
  };

  const renameChat = () => {
    setChats((prevChats) =>
      prevChats.map(chat =>
        chat.id === editingChatId ? { ...chat, name: editingChatName } : chat
      )
    );
    setEditingChatId(null);
    setEditingChatName('');
  };

  const cancelRename = () => {
    setEditingChatId(null);
    setEditingChatName('');
  };

  const formatContent = (content) => {
    let listIndex = 1;
    const formattedContent = content
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert lines starting with * to incrementing numbered list
      .replace(/^\*\s(.*)$/gm, () => `<li>${listIndex++}. $1</li>`);

    const wrappedContent = formattedContent
      // Wrap list items in <ol> tags
      .replace(/(<li>.*<\/li>)/g, '<ol style="list-style-position: inside;">$1</ol>');

    return wrappedContent.split('\n').map((text, i) => (
      <div key={i} style={{ marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: text }} />
    ));
  };

  return (
    <Box display='flex' height='100vh'>
      {/* Sidebar */}
      <Box width='300px' borderRight='1px solid black' p={2} display='flex' flexDirection='column'>
        <Button variant='contained' color='primary' onClick={createNewChat} sx={{ mb: 2 }}>
          New Chat
        </Button>
        <List>
          {chats.map((chat) => (
            <ListItem
              key={chat.id}
              button
              onClick={() => switchChat(chat.id)}
              selected={chat.id === currentChatId}
              onDoubleClick={() => startRenamingChat(chat.id, chat.name)}
              sx={{ position: 'relative' }}
            >
              {editingChatId === chat.id ? (
                <Input
                  value={editingChatName}
                  onChange={(e) => setEditingChatName(e.target.value)}
                  onBlur={renameChat}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      renameChat();
                    } else if (e.key === 'Escape') {
                      cancelRename();
                    }
                  }}
                  autoFocus
                />
              ) : (
                <ListItemText primary={chat.name} />
              )}
              <Button
                onClick={() => deleteChat(chat.id)}
                sx={{
                  position: 'absolute',
                  right: 0,
                  opacity: 0,
                  transition: 'opacity 0.3s',
                  backgroundColor: 'red',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 4px',
                  '&:hover': {
                    opacity: 1,
                  },
                }}
                variant="contained"
              >
                Clear Chat
              </Button>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Main Chat Area */}
      <Box flexGrow={1} display='flex' flexDirection='column' justifyContent='center' alignItems='center'>
        {/* Heading */}
        <Box mb={2} textAlign="center">
          <Typography variant="h4" component="span" sx={{ color: 'blue' }}>
            Code
          </Typography>
          <Typography variant="h4" component="span" sx={{ color: 'black' }}>
            Mentor
          </Typography>
          <Typography variant="subtitle1" component="div" sx={{ color: 'gray' }}>
            Your AI Guide to Smarter Coding Solutions
          </Typography>
        </Box>

        <FormControl sx={{ mb: 2, width: '600px' }}>
          <InputLabel id="language-select-label">Select Language</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={language}
            label="Select Language"
            onChange={(e) => setLanguage(e.target.value)}
          >
            <MenuItem value={'English'}>English</MenuItem>
            <MenuItem value={'Spanish'}>Spanish</MenuItem>
            <MenuItem value={'French'}>French</MenuItem>
            <MenuItem value={'German'}>German</MenuItem>
            <MenuItem value={'Chinese'}>Chinese</MenuItem>
            <MenuItem value={'Japanese'}>Japanese</MenuItem>
            <MenuItem value={'Korean'}>Korean</MenuItem>
            <MenuItem value={'Hindi'}>Hindi</MenuItem>
            <MenuItem value={'Arabic'}>Arabic</MenuItem>
          </Select>
        </FormControl>

        <Stack
          direction='column'
          width='600px'
          height='700px'
          border='1px solid black'
          p={2}
          spacing={3}
        >
          <Stack
            direction='column'
            spacing={2}
            flexGrow={1}
            overflow='auto'
            maxHeight='100%'
          >
            {currentChat?.messages.map((message, index) => (
              <Box
                key={index}
                display='inline-block'
                alignSelf={
                  message.role === 'assistant' ? 'flex-start' : 'flex-end'
                }
                bgcolor={
                  message.role === 'assistant' ? 'primary.main' : 'secondary.main'
                }
                color='white'
                borderRadius={8}
                p={2}
                maxWidth="75%"
                sx={{
                  wordBreak: 'break-word',
                  marginBottom: '8px',
                }}
              >
                {formatContent(message.content)}
              </Box>
            ))}
          </Stack>
          <Stack direction='row' spacing={2}>
            <TextField
              label="Message Code Mentor"
              variant="outlined"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button variant='contained' onClick={sendMessage}>
              Send
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}