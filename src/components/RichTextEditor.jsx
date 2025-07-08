import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import DOMPurify from 'dompurify';
import { Box, Paper } from '@mui/material';
import 'react-quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder, label }) => {
  // 툴바 모듈 설정
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'blockquote',
    'list', 'bullet', 'link',
  ];

  // 안전한 HTML 변경 핸들러
  const handleChange = (html) => {
    // XSS 방지를 위한 HTML 정제
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'blockquote', 'ol', 'ul', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target']
    });
    onChange(sanitizedHtml);
  };

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Box sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500, color: 'rgba(0, 0, 0, 0.6)' }}>
          {label}
        </Box>
      )}
      <Paper 
        elevation={1} 
        sx={{ 
          '& .ql-editor': {
            minHeight: '250px',
            fontSize: '16px',
            lineHeight: 1.6,
            fontFamily: 'inherit'
          },
          '& .ql-toolbar': {
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa'
          },
          '& .ql-container': {
            borderBottom: 'none'
          },
          // 모바일 최적화
          '@media (max-width: 768px)': {
            '& .ql-toolbar': {
              flexWrap: 'wrap',
              '& .ql-formats': {
                marginRight: '8px'
              }
            },
            '& .ql-editor': {
              fontSize: '14px',
              minHeight: '200px'
            }
          }
        }}
      >
        <ReactQuill
          theme="snow"
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
        />
      </Paper>
    </Box>
  );
};

export default RichTextEditor;