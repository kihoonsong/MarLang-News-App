import React, { useRef, useState, useEffect } from 'react';
import { Box, Paper, ButtonGroup, Button, Divider } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Link,
  Title
} from '@mui/icons-material';
import DOMPurify from 'dompurify';

const SimpleRichEditor = ({ value, onChange, placeholder, label }) => {
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isEditorReady) {
      editorRef.current.innerHTML = value || '';
      setIsEditorReady(true);
    }
  }, [value, isEditorReady]);

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current && onChange) {
      const content = editorRef.current.innerHTML;
      const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'blockquote', 'ol', 'ul', 'li', 'a'],
        ALLOWED_ATTR: ['href', 'target']
      });
      onChange(sanitizedContent);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand('insertHTML', '<br><br>');
    }
  };

  const addLink = () => {
    const url = prompt('링크 URL을 입력하세요:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const formatHeader = (level) => {
    executeCommand('formatBlock', `<h${level}>`);
  };

  const toolbarButtons = [
    { command: 'bold', icon: FormatBold, title: '굵게' },
    { command: 'italic', icon: FormatItalic, title: '기울임' },
    { command: 'underline', icon: FormatUnderlined, title: '밑줄' },
    { divider: true },
    { command: 'insertOrderedList', icon: FormatListNumbered, title: '번호 목록' },
    { command: 'insertUnorderedList', icon: FormatListBulleted, title: '불릿 목록' },
    { divider: true },
    { command: 'formatBlock', value: 'blockquote', icon: FormatQuote, title: '인용' },
    { custom: addLink, icon: Link, title: '링크' },
    { divider: true },
    { custom: () => formatHeader(1), icon: Title, title: '제목 1' },
    { custom: () => formatHeader(2), icon: Title, title: '제목 2' },
    { custom: () => formatHeader(3), icon: Title, title: '제목 3' }
  ];

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Box sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500, color: 'rgba(0, 0, 0, 0.6)' }}>
          {label}
        </Box>
      )}
      <Paper elevation={1} sx={{ border: '1px solid #e0e0e0' }}>
        {/* 툴바 */}
        <Box sx={{ p: 1, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
          <ButtonGroup variant="text" size="small">
            {toolbarButtons.map((button, index) => {
              if (button.divider) {
                return <Divider key={index} orientation="vertical" flexItem sx={{ mx: 0.5 }} />;
              }
              
              const IconComponent = button.icon;
              return (
                <Button
                  key={index}
                  onClick={() => {
                    if (button.custom) {
                      button.custom();
                    } else {
                      executeCommand(button.command, button.value);
                    }
                  }}
                  title={button.title}
                  sx={{ 
                    minWidth: 36, 
                    p: 0.5,
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <IconComponent fontSize="small" />
                </Button>
              );
            })}
          </ButtonGroup>
        </Box>

        {/* 에디터 영역 */}
        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          sx={{
            minHeight: '250px',
            p: 2,
            fontSize: '16px',
            lineHeight: 1.6,
            fontFamily: 'inherit',
            outline: 'none',
            '&:empty:before': {
              content: 'attr(data-placeholder)',
              color: 'rgba(0, 0, 0, 0.6)',
              fontStyle: 'italic'
            },
            '& h1': { fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0' },
            '& h2': { fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' },
            '& h3': { fontSize: '1.25rem', fontWeight: 'bold', margin: '0.5rem 0' },
            '& blockquote': { 
              borderLeft: '4px solid #ddd', 
              paddingLeft: '1rem', 
              margin: '0.5rem 0',
              fontStyle: 'italic'
            },
            '& ul, & ol': { paddingLeft: '1.5rem', margin: '0.5rem 0' },
            '& li': { margin: '0.25rem 0' },
            '& a': { color: '#1976d2', textDecoration: 'underline' },
            // 모바일 최적화
            '@media (max-width: 768px)': {
              fontSize: '14px',
              minHeight: '200px',
              p: 1.5
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default SimpleRichEditor;