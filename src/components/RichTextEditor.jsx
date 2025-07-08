import SimpleRichEditor from './SimpleRichEditor';

const RichTextEditor = ({ value, onChange, placeholder, label }) => {
  return (
    <SimpleRichEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      label={label}
    />
  );
};

export default RichTextEditor;