import React, { useEffect, useState } from "react";
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const formatDateToDDMMYY = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

const convertOldDateToDDMMYY = (dateStr) => {
  const [month, day, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return formatDateToDDMMYY(date);
};

const ExpenseForm = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("household");
  const [expense, setExpense] = useState(() => {
    const saved = localStorage.getItem("expenses");
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map(exp => ({
      ...exp,
      date: exp.date.includes('/') ? convertOldDateToDDMMYY(exp.date) : exp.date
    }));
  });
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [sortBy, setSortBy] = useState("none");
  const [showCharts, setShowCharts] = useState(false);
  const [darkMode,setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true" || false;
  });

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  }

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expense));
  }, [expense]);

  useEffect(() => {
    if(darkMode){
      document.documentElement.classList.add("dark");
    }else{
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode",darkMode);
  },[darkMode])

  const parseDDMMYY = (dateStr) => {
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(2000 + year, month - 1, day);
  };

  const convertDDMMYYtoYYYYMMDD = (dateStr) => {
    const [day, month, year] = dateStr.split('-').map(Number);
    const fullYear = 2000 + year;
    return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleExpense = () => {
    if (!name || !amount) {
      setToast("Please Enter name and amount");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const newExpense = {
      id: Date.now(),
      name,
      amount,
      category,
      date: formatDateToDDMMYY(new Date()),
    };
    setExpense([...expense, newExpense]);
    setName("");
    setAmount("");
    setCategory("household");
  };

  const handleDelete = (id) => {
    const updatedExpenses = expense.filter((exp) => exp.id !== id);
    setExpense(updatedExpenses);
  };

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setEditName(exp.name);
    setEditAmount(exp.amount);
    setEditCategory(exp.category);
    setEditDate(convertDDMMYYtoYYYYMMDD(exp.date));
  };

  const handleSaveEdit = (id) => {
    if (!editName || !editAmount) {
      setToast("Please enter name and amount");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const updatedExpenses = expense.map((exp) =>
      exp.id === id
        ? { ...exp, name: editName, amount: editAmount, category: editCategory, date: formatDateToDDMMYY(new Date(editDate)) }
        : exp
    );
    setExpense(updatedExpenses);
    setEditingId(null);
    setEditName("");
    setEditAmount("");
    setEditCategory("");
    setEditDate("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditAmount("");
    setEditCategory("");
    setEditDate("");
  };

  const filtered = (selectedCategory === "all" ? expense : expense.filter(exp => exp.category === selectedCategory))
    .filter(exp => exp.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredExpenses = [...filtered].sort((a, b) => {
    if (sortBy === "date-desc") return parseDDMMYY(b.date) - parseDDMMYY(a.date);
    if (sortBy === "amount-asc") return parseFloat(a.amount) - parseFloat(b.amount);
    return 0;
  });

  const getCategoryData = () => {
    const categoryTotals = expense.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});


    return {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      }]
    };
  };

  const getDateData = () => {
    const dateTotals = expense.reduce((acc, exp) => {
      acc[exp.date] = (acc[exp.date] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});

    return {
      labels: Object.keys(dateTotals),
      datasets: [{
        label: 'Expenses by Date',
        data: Object.values(dateTotals),
        backgroundColor: '#36A2EB',
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { callbacks: { label: (context) => `₹${context.parsed.toFixed(2)}` } }
    }
  };


  const exportToCSV = () => {
    console.log("Expenses:",expense);
    const csv = [
      "Name,Amount,Category,Date", 
      ...expense.map(exp => `${exp.name},${exp.amount},${exp.category},${exp.date}`) 
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    window.URL.revokeObjectURL(url); 
    setToast("Expenses exported successfully!");
    setTimeout(() => setToast(null), 3000);
  };


  return (
    <div className="p-4 max-w-4xl mx-auto min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
      <div className={`fixed top-4 right-4 bg-red-500 text-white p-2 rounded transition-opacity duration-300 ${toast ? 'opacity-100' : 'opacity-0 invisible'}`}>
        {toast}
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center ">Add Expense</h1>
        <button onClick={toggleDarkMode} className="bg-gray-800 text-white p-2 rounded">{darkMode ? "Light Mode" : "Dark Mode"}</button>
      </div>
      

      <div className="space-y-3 border p-4 rounded shadow-md bg-gray-50 dark:bg-gray-800">
        <div>
          <label className="block font-semibold">Name</label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
          />
        </div>
        <div>
          <label className="block font-semibold">Amount</label>
          <input
            onChange={(e) => setAmount(e.target.value)}
            value={amount}
            type="number"
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
          />
        </div>
        <div>
          <label className="block font-semibold">Category</label>
          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
          >
            <option value="household">Household</option>
            <option value="medicine">Medicine</option>
            <option value="transport">Transport</option>
            <option value="others">Others</option>
          </select>
        </div>
        <button
          onClick={handleExpense}
          className="w-full bg-blue-500 text-white p-2 rounded font-bold hover:bg-blue-600"
        >
          Add +
        </button>
      </div>

      <button
        onClick={() => setShowCharts(!showCharts)}
        className="w-full bg-purple-500 text-white p-2 rounded font-bold hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 mb-6 mt-6">
        {showCharts ? 'Hide Visualizations' : 'Show Visualizations'}
      </button>

      <button 
      onClick={exportToCSV}
      className="w-full bg-green-500 text-white p-2 rounded font-bold hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 mb-6 mt-6">
        Export to CSV
      </button>

      {showCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border p-4 rounded shadow-md bg-gray-50 dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-2 text-center">Expenses by Category</h2>
            <Pie data={getCategoryData()} options={chartOptions} />
          </div>
          <div className="border p-4 rounded shadow-md">
            <h2 className="text-xl font-bold mb-2 text-center">Expenses by Date</h2>
            <Bar data={getDateData()} options={{
              ...chartOptions,
              scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Amount (₹)' } },
                x: { title: { display: true, text: 'Date' } }
              }
            }} />
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-4">
          <p className="font-semibold">
            Total: ₹{filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2)}
          </p>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name"
          className="w-full border p-2 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />
        <div>
          Filter:
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="p-2 rounded ml-2 bg-white dark:bg-gray-700 text-black dark:text-white">
            <option value="all">All</option>
            <option value="household">Household</option>
            <option value="transport">Transport</option>
            <option value="medicine">Medicine</option>
            <option value="others">Others</option>
          </select>
        </div>
        <div>
          Sort by:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 rounded ml-2 bg-white dark:bg-gray-700 text-black dark:text-white">
            <option value="none">No Sorting</option>
            <option value="date-desc">Newest First</option>
            <option value="amount-asc">Amount (Low to High)</option>
          </select>
        </div>
        <h2 className="text-xl font-bold mb-2">Expenses List</h2>
        {filteredExpenses.length === 0 ? (
          <p className="text-gray-500">
            {expense.length === 0 ? "No expense added yet" : "No matching expenses found"}
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredExpenses.map((exp) => (
              <li key={exp.id} className="border p-2 rounded shadow flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                {editingId === exp.id ? (
                  <div className="w-full">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                     className="w-full p-1 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
                    />
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full p-1 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                     className="w-full p-1 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
                    />
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                     className="w-full p-1 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
                    >
                      <option value="household">Household</option>
                      <option value="medicine">Medicine</option>
                      <option value="transport">Transport</option>
                      <option value="others">Others</option>
                    </select>
                    <button
                      onClick={() => handleSaveEdit(exp.id)}
                      className="w-full bg-green-500 dark:bg-green-600 text-white p-1 rounded mt-2 hover:bg-green-600 dark:hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="w-full bg-red-500 dark:bg-red-600 text-white p-1 rounded mt-2 hover:bg-red-600 dark:hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-bold">{exp.name}</h4>
                      <p className="text-gray-500 dark:text-gray-400">₹{exp.amount}</p>
                      <p className="text-gray-600 dark:text-gray-300">{exp.category}{exp.date ? ` - ${exp.date}` : ""}</p>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => handleEdit(exp)} className="bg-yellow-500 dark:bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-600 dark:hover:bg-yellow-700">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(exp.id)} className="bg-red-500 dark:bg-red-600 text-white px-2 py-1 rounded hover:bg-red-600 dark:hover:bg-red-700">
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExpenseForm;