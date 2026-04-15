import { useState } from "react";

const MyComponent = () => {
  const [likes, setLikes] = useState(0);

  return (
    <div style={{
      border: "2px solid #7f5af0",
      borderRadius: "12px",
      padding: "20px",
      marginTop: "20px",
      background: "linear-gradient(135deg, #f5f7ff, #e0c3fc)",
      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
      maxWidth: "400px",
      textAlign: "center"
    }}>
      <h2 style={{ color: "#7f5af0" }}>My Cool Component</h2>
      <p>This is a custom React component added to your Vite app!</p>
      <button 
        onClick={() => setLikes(likes + 1)}
        style={{
          background: "#7f5af0",
          color: "white",
          border: "none",
          padding: "10px 15px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        Like ({likes})
      </button>
    </div>
  );
};

export default MyComponent;
