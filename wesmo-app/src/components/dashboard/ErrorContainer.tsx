import React, { useState, useEffect } from "react";
import "./ErrorContainer.css";
import { DataItem } from "../../pages/data.tsx";

interface Props {
  data: DataItem[];
}

const ErrorLog: React.FC<Props> = ({ data }) => {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const newErrors = data
      .filter((item) => item.name === "Error")
      .map((item) => String(item.value));

    setErrors((prevErrors) => [...newErrors, ...prevErrors]);
  }, [data]);

  const errorListItems = errors.map((error, index) => (
    <li key={index}>{error}</li>
  ));

  return (
    <div className="error_log">
      <div className="title">
        <h3>Vehicle Errors</h3>
      </div>
      <br />
      <div className="scolling_list">
        <ul>{errorListItems}</ul>
      </div>
    </div>
  );
};

export default ErrorLog;