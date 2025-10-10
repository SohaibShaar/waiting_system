import { useEffect, useState } from "react";
import "./App.css";

interface Data {
  message: string;
}

function App() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    fetch("http://localhost:3001")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.log(err));
  });

  return (
    <div className='text-red-500'>
      <h1>{data?.message}</h1>
    </div>
  );
}

export default App;
