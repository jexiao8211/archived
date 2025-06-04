import React, { useState, type FormEvent, type ChangeEvent } from 'react';

interface AddFruitFormProps {
  addFruit: (fruitName: string) => void;
}

const AddFruitForm: React.FC<AddFruitFormProps> = ({ addFruit }) => {
  const [fruitName, setFruitName] = useState<string>('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fruitName) {
      addFruit(fruitName);
      setFruitName('');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFruitName(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={fruitName}
        onChange={handleChange}
        placeholder="Enter fruit name"
      />
      <button type="submit">Add Fruit</button>
    </form>
  );
};

export default AddFruitForm;
