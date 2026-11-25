import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import "./Dashboard.css";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

function App() {
  const [page, setPage] = useState("home");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const [income, setIncome] = useState(0);
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [incomeInput, setIncomeInput] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [category, setCategory] = useState("Food");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [savingsGoal, setSavingsGoal] = useState(0);
  const [goalInput, setGoalInput] = useState("");

  const [monthlyBudgets, setMonthlyBudgets] = useState({});
  const [budgetInput, setBudgetInput] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();

    return `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`;
  });

  const chartColors = [
    "#2563eb",
    "#e11d48",
    "#059669",
    "#f59e0b",
    "#9333ea",
    "#0891b2"
  ];

  // Get transaction month
  const getMonthKey = (item) => {
    if (item.dateKey) {
      return item.dateKey.slice(0, 7);
    }

    if (!item.date) return "";

    const parts = item.date.split("/");

    if (parts.length === 3) {
      const first = Number(parts[0]);
      const second = Number(parts[1]);
      const year = parts[2];

      const month = first > 12 ? second : first;

      return `${year}-${String(month).padStart(2, "0")}`;
    }

    return "";
  };

  // Display date
  const getDisplayDate = (item) => {
    if (item.dateKey) {
      return new Date(
        item.dateKey + "T00:00:00"
      ).toLocaleDateString("en-IN");
    }

    return item.date || "";
  };

  // Load saved user data
  useEffect(() => {
    if (!currentUser) return;

    const saved = JSON.parse(
      localStorage.getItem("budget_" + currentUser.email) || "{}"
    );

    setIncome(saved.income || 0);
    setIncomeHistory(saved.incomeHistory || []);
    setExpenses(saved.expenses || []);
    setSavingsGoal(saved.savingsGoal || 0);

    const budgets = saved.monthlyBudgets || {};

    setMonthlyBudgets(budgets);

    setBudgetInput(
      budgets[selectedMonth]
        ? String(budgets[selectedMonth])
        : ""
    );
  }, [currentUser, selectedMonth]);

  // Save user budget data
  const saveBudget = (
    newIncome,
    newExpenses,
    newGoal,
    newIncomeHistory = incomeHistory,
    newBudgets = monthlyBudgets
  ) => {
    if (!currentUser) return;

    localStorage.setItem(
      "budget_" + currentUser.email,
      JSON.stringify({
        income: newIncome,
        incomeHistory: newIncomeHistory,
        expenses: newExpenses,
        savingsGoal: newGoal,
        monthlyBudgets: newBudgets
      })
    );
  };

  // Signup
  const signup = (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setMessage("Please fill all fields.");
      return;
    }

    const users = JSON.parse(
      localStorage.getItem("users") || "[]"
    );

    if (
      users.some(
        (user) =>
          user.email.toLowerCase() === email.trim().toLowerCase()
      )
    ) {
      setMessage("Email already registered. Please login.");
      return;
    }

    users.push({
      name: name.trim(),
      email: email.trim(),
      password
    });

    localStorage.setItem("users", JSON.stringify(users));

    setName("");
    setPassword("");
    setMessage("Account created! Please login.");
    setPage("login");
  };

  // Login
  const login = (e) => {
    e.preventDefault();

    const users = JSON.parse(
      localStorage.getItem("users") || "[]"
    );

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );

    if (user) {
      setCurrentUser(user);
      setMessage("");
      setPage("dashboard");
      setEmail("");
      setPassword("");
    } else {
      setMessage("Invalid email or password.");
    }
  };

  // Add Income
  const addIncome = (e) => {
    e.preventDefault();

    const amount = Number(incomeInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid income amount.");
      return;
    }

    const today = new Date();

    const newEntry = {
      id: Date.now(),
      amount,
      date: today.toLocaleDateString("en-IN"),
      dateKey: [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
      ].join("-")
    };

    const updatedIncome = income + amount;
    const updatedHistory = [...incomeHistory, newEntry];

    setIncome(updatedIncome);
    setIncomeHistory(updatedHistory);

    saveBudget(
      updatedIncome,
      expenses,
      savingsGoal,
      updatedHistory
    );

    setIncomeInput("");
  };

  // Delete Income
  const deleteIncome = (id) => {
    const deletedItem = incomeHistory.find(
      (item) => item.id === id
    );

    if (!deletedItem) return;

    const updatedHistory = incomeHistory.filter(
      (item) => item.id !== id
    );

    const updatedIncome = Math.max(
      0,
      income - Number(deletedItem.amount)
    );

    setIncomeHistory(updatedHistory);
    setIncome(updatedIncome);

    saveBudget(
      updatedIncome,
      expenses,
      savingsGoal,
      updatedHistory
    );
  };

  // Add Expense
  const addExpense = (e) => {
    e.preventDefault();

    const amount = Number(expenseAmount);

    if (
      !expenseName.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert("Enter a valid expense name and amount.");
      return;
    }

    const today = new Date();

    const newExpense = {
      id: Date.now(),
      name: expenseName.trim(),
      amount,
      category,
      date: today.toLocaleDateString("en-IN"),
      dateKey: [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
      ].join("-")
    };

    const updatedExpenses = [...expenses, newExpense];

    setExpenses(updatedExpenses);

    saveBudget(
      income,
      updatedExpenses,
      savingsGoal
    );

    setExpenseName("");
    setExpenseAmount("");
  };

  // Delete Expense
  const deleteExpense = (id) => {
    const updatedExpenses = expenses.filter(
      (item) => item.id !== id
    );

    setExpenses(updatedExpenses);

    saveBudget(
      income,
      updatedExpenses,
      savingsGoal
    );
  };

  // Update Savings Goal
  const updateGoal = (e) => {
    e.preventDefault();

    const amount = Number(goalInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid savings goal.");
      return;
    }

    setSavingsGoal(amount);

    saveBudget(
      income,
      expenses,
      amount
    );

    setGoalInput("");
  };

  // Set Monthly Budget
  const updateMonthlyBudget = (e) => {
    e.preventDefault();

    const amount = Number(budgetInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid monthly budget limit.");
      return;
    }

    const updatedBudgets = {
      ...monthlyBudgets,
      [selectedMonth]: amount
    };

    setMonthlyBudgets(updatedBudgets);

    saveBudget(
      income,
      expenses,
      savingsGoal,
      incomeHistory,
      updatedBudgets
    );

    alert("Monthly budget limit saved successfully!");
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    setIncome(0);
    setIncomeHistory([]);
    setExpenses([]);
    setSavingsGoal(0);
    setMonthlyBudgets({});
    setBudgetInput("");
    setSearchTerm("");
    setFilterCategory("All");
    setMessage("");
    setPage("home");
  };

  // Overall calculations
  const totalExpenses = expenses.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  const balance = income - totalExpenses;

  // Search and filter expenses
  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "All" ||
      item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Monthly calculations
  const monthlyExpenses = expenses.filter(
    (item) => getMonthKey(item) === selectedMonth
  );

  const monthlyIncome = incomeHistory.filter(
    (item) => getMonthKey(item) === selectedMonth
  );

  const monthlyTotalIncome = monthlyIncome.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  const monthlyTotalExpenses = monthlyExpenses.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  const monthlyBalance =
    monthlyTotalIncome - monthlyTotalExpenses;

  // Monthly budget calculations
  const selectedMonthBudget = Number(
    monthlyBudgets[selectedMonth] || 0
  );

  const budgetRemaining =
    selectedMonthBudget - monthlyTotalExpenses;

  const budgetUsage =
    selectedMonthBudget > 0
      ? (monthlyTotalExpenses / selectedMonthBudget) * 100
      : 0;

  // Financial Health Score
  let financialHealthScore = 0;

  if (monthlyTotalIncome > 0) {
    const savingsRate =
      monthlyBalance / monthlyTotalIncome;

    const savingsScore =
      Math.min(Math.max(savingsRate, 0), 1) * 40;

    const expenseRatio =
      monthlyTotalExpenses / monthlyTotalIncome;

    let expenseScore = 0;

    if (expenseRatio <= 0.5) {
      expenseScore = 40;
    } else if (expenseRatio <= 0.8) {
      expenseScore =
        40 - ((expenseRatio - 0.5) / 0.3) * 20;
    } else if (expenseRatio <= 1) {
      expenseScore =
        20 - ((expenseRatio - 0.8) / 0.2) * 20;
    }

    let budgetScore = 10;

    if (selectedMonthBudget > 0) {
      if (budgetUsage <= 80) {
        budgetScore = 20;
      } else if (budgetUsage <= 100) {
        budgetScore = 10;
      } else {
        budgetScore = 0;
      }
    }

    financialHealthScore = Math.round(
      savingsScore + expenseScore + budgetScore
    );
  }

  // Financial Health Rating
  const healthRating =
    monthlyTotalIncome === 0
      ? "Add Monthly Income"
      : financialHealthScore >= 80
      ? "Excellent 🌟"
      : financialHealthScore >= 60
      ? "Good 😊"
      : financialHealthScore >= 40
      ? "Fair 💜"
      : "Needs Improvement";

  // Category totals
  const monthlyCategoryTotals = monthlyExpenses.reduce(
    (result, item) => {
      result[item.category] =
        (result[item.category] || 0) + Number(item.amount);

      return result;
    },
    {}
  );

  const categoryTotals = expenses.reduce((result, item) => {
    result[item.category] =
      (result[item.category] || 0) + Number(item.amount);

    return result;
  }, {});

  const categoryPieData = Object.entries(categoryTotals).map(
    ([name, value]) => ({
      name,
      value
    })
  );

  // SMART SPENDING INSIGHTS
  const monthlyCategoryEntries = Object.entries(
    monthlyCategoryTotals
  ).sort((a, b) => b[1] - a[1]);

  const highestSpendingCategory =
    monthlyCategoryEntries.length > 0
      ? monthlyCategoryEntries[0]
      : null;

  const topThreeCategories =
    monthlyCategoryEntries.slice(0, 3);

  const highestCategoryPercentage =
    highestSpendingCategory && monthlyTotalExpenses > 0
      ? (
          (highestSpendingCategory[1] /
            monthlyTotalExpenses) *
          100
        ).toFixed(1)
      : 0;

  const getSpendingInsight = () => {
    if (monthlyExpenses.length === 0) {
      return "Add expenses to discover your spending patterns.";
    }

    if (
      monthlyTotalIncome > 0 &&
      monthlyTotalExpenses > monthlyTotalIncome
    ) {
      return "Your expenses are higher than your income this month. Review your spending and consider reducing non-essential expenses.";
    }

    if (
      selectedMonthBudget > 0 &&
      budgetUsage > 100
    ) {
      return "You have exceeded your monthly budget. Review your largest spending categories.";
    }

    if (
      selectedMonthBudget > 0 &&
      budgetUsage >= 80
    ) {
      return "You have used at least 80% of your monthly budget. Keep an eye on your remaining expenses.";
    }

    if (highestSpendingCategory) {
      return `${highestSpendingCategory[0]} is your highest spending category. Reviewing these expenses may help you manage your budget.`;
    }

    return "Keep recording your expenses to receive useful spending insights.";
  };

  const spendingInsight = getSpendingInsight();

  // Six-month chart data
  const monthlyChartData = Array.from(
    { length: 6 },
    (_, index) => {
      const date = new Date();

      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));

      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const monthKey = `${year}-${month}`;

      const monthIncome = incomeHistory
        .filter((item) => getMonthKey(item) === monthKey)
        .reduce(
          (sum, item) => sum + Number(item.amount),
          0
        );

      const monthExpense = expenses
        .filter((item) => getMonthKey(item) === monthKey)
        .reduce(
          (sum, item) => sum + Number(item.amount),
          0
        );

      return {
        month: date.toLocaleDateString("en-IN", {
          month: "short"
        }),
        income: monthIncome,
        expenses: monthExpense
      };
    }
  );

  // Savings progress
  const savingsProgress =
    savingsGoal > 0
      ? Math.min(
          Math.max(
            (Math.max(balance, 0) / savingsGoal) * 100,
            0
          ),
          100
        )
      : 0;

  const formattedMonth = new Date(
    selectedMonth + "-01T00:00:00"
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });

  // Download PDF Report
  const downloadPDF = () => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = 20;

    const addText = (text, fontSize = 11) => {
      doc.setFontSize(fontSize);

      const lines = doc.splitTextToSize(
        String(text),
        pageWidth - 40
      );

      if (y + lines.length * 7 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.text(lines, 20, y);
      y += lines.length * 7 + 3;
    };

    doc.setFontSize(20);
    doc.text("Budget Planner - Financial Report", 20, y);
    y += 12;

    addText(`User: ${currentUser.name}`, 12);
    addText(`Email: ${currentUser.email}`, 12);
    addText(
      `Report Date: ${new Date().toLocaleDateString("en-IN")}`
    );

    y += 5;

    addText("OVERALL FINANCIAL SUMMARY", 15);
    addText(`Total Income: Rs. ${income.toFixed(2)}`);
    addText(`Total Expenses: Rs. ${totalExpenses.toFixed(2)}`);
    addText(`Remaining Balance: Rs. ${balance.toFixed(2)}`);
    addText(`Savings Goal: Rs. ${savingsGoal.toFixed(2)}`);

    y += 5;

    addText("FINANCIAL HEALTH SCORE", 15);
    addText(
      `Score: ${monthlyTotalIncome > 0 ? financialHealthScore + "/100" : "Not available"}`
    );
    addText(`Rating: ${healthRating}`);

    y += 5;

    addText("SMART SPENDING INSIGHTS", 15);
    addText(spendingInsight);

    if (highestSpendingCategory) {
      addText(
        `Highest Category: ${highestSpendingCategory[0]}`
      );
      addText(
        `Highest Category Amount: Rs. ${highestSpendingCategory[1].toFixed(2)}`
      );
      addText(
        `Share of Expenses: ${highestCategoryPercentage}%`
      );
    }

    y += 5;

    addText("MONTHLY FINANCIAL SUMMARY", 15);
    addText(`Month: ${formattedMonth}`);
    addText(`Monthly Income: Rs. ${monthlyTotalIncome.toFixed(2)}`);
    addText(`Monthly Expenses: Rs. ${monthlyTotalExpenses.toFixed(2)}`);
    addText(`Monthly Balance: Rs. ${monthlyBalance.toFixed(2)}`);
    addText(`Monthly Budget: Rs. ${selectedMonthBudget.toFixed(2)}`);

    y += 5;

    addText("INCOME HISTORY", 15);

    if (incomeHistory.length === 0) {
      addText("No income records available.");
    } else {
      incomeHistory.forEach((item, index) => {
        addText(
          `${index + 1}. Rs. ${Number(item.amount).toFixed(2)} - ${getDisplayDate(item)}`
        );
      });
    }

    y += 5;

    addText("EXPENSE HISTORY", 15);

    if (expenses.length === 0) {
      addText("No expense records available.");
    } else {
      expenses.forEach((item, index) => {
        addText(
          `${index + 1}. ${item.name} | ${item.category} | Rs. ${Number(item.amount).toFixed(2)} | ${getDisplayDate(item)}`
        );
      });
    }

    y += 5;

    addText("CATEGORY BREAKDOWN", 15);

    if (Object.keys(categoryTotals).length === 0) {
      addText("No category records available.");
    } else {
      Object.entries(categoryTotals).forEach(([cat, amount]) => {
        addText(`${cat}: Rs. ${amount.toFixed(2)}`);
      });
    }

    doc.save("Budget-Planner-Financial-Report.pdf");
  };

  // Download Excel Report
  const downloadExcel = () => {
    const workbook = XLSX.utils.book_new();

    const summaryData = [
      { Particulars: "User Name", Value: currentUser.name },
      { Particulars: "Email", Value: currentUser.email },
      {
        Particulars: "Report Date",
        Value: new Date().toLocaleDateString("en-IN")
      },
      { Particulars: "Total Income", Value: income },
      { Particulars: "Total Expenses", Value: totalExpenses },
      { Particulars: "Remaining Balance", Value: balance },
      { Particulars: "Savings Goal", Value: savingsGoal },
      {
        Particulars: "Financial Health Score",
        Value: monthlyTotalIncome > 0
          ? `${financialHealthScore}/100`
          : "Not available"
      },
      { Particulars: "Health Rating", Value: healthRating },
      { Particulars: "Selected Month", Value: formattedMonth },
      { Particulars: "Monthly Income", Value: monthlyTotalIncome },
      { Particulars: "Monthly Expenses", Value: monthlyTotalExpenses },
      { Particulars: "Monthly Balance", Value: monthlyBalance },
      { Particulars: "Monthly Budget", Value: selectedMonthBudget },
      {
        Particulars: "Highest Spending Category",
        Value: highestSpendingCategory
          ? highestSpendingCategory[0]
          : "No expenses"
      },
      {
        Particulars: "Highest Category Amount",
        Value: highestSpendingCategory
          ? highestSpendingCategory[1]
          : 0
      },
      {
        Particulars: "Spending Insight",
        Value: spendingInsight
      }
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Summary"
    );

    // Income sheet
    const incomeData = incomeHistory.map((item) => ({
      Amount: Number(item.amount),
      Date: getDisplayDate(item)
    }));

    const incomeSheet = XLSX.utils.json_to_sheet(
      incomeData.length
        ? incomeData
        : [{ Message: "No income records" }]
    );

    XLSX.utils.book_append_sheet(
      workbook,
      incomeSheet,
      "Income"
    );

    // Expenses sheet
    const expenseData = expenses.map((item) => ({
      Expense: item.name,
      Category: item.category,
      Amount: Number(item.amount),
      Date: getDisplayDate(item)
    }));

    const expenseSheet = XLSX.utils.json_to_sheet(
      expenseData.length
        ? expenseData
        : [{ Message: "No expense records" }]
    );

    XLSX.utils.book_append_sheet(
      workbook,
      expenseSheet,
      "Expenses"
    );

    // Monthly summary sheet
    const monthlyData = [
      {
        Month: formattedMonth,
        Income: monthlyTotalIncome,
        Expenses: monthlyTotalExpenses,
        Balance: monthlyBalance,
        Budget: selectedMonthBudget,
        BudgetUsedPercentage: Number(budgetUsage.toFixed(2))
      }
    ];

    const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);

    XLSX.utils.book_append_sheet(
      workbook,
      monthlySheet,
      "Monthly Summary"
    );

    // Category breakdown sheet
    const categoryData = Object.entries(categoryTotals).map(
      ([cat, amount]) => ({
        Category: cat,
        TotalAmount: amount
      })
    );

    const categorySheet = XLSX.utils.json_to_sheet(
      categoryData.length
        ? categoryData
        : [{ Message: "No category records" }]
    );

    XLSX.utils.book_append_sheet(
      workbook,
      categorySheet,
      "Categories"
    );

    // Monthly spending insights sheet
    const insightsData = monthlyCategoryEntries.map(
      ([cat, amount], index) => ({
        Rank: index + 1,
        Category: cat,
        Amount: amount,
        Percentage: Number(
          ((amount / monthlyTotalExpenses) * 100).toFixed(2)
        )
      })
    );

    const insightsSheet = XLSX.utils.json_to_sheet(
      insightsData.length
        ? insightsData
        : [{ Message: "No monthly spending insights available" }]
    );

    XLSX.utils.book_append_sheet(
      workbook,
      insightsSheet,
      "Spending Insights"
    );

    XLSX.writeFile(
      workbook,
      "Budget-Planner-Financial-Report.xlsx"
    );
  };

  return (
    <div className="app">

      {/* HOME PAGE */}
      {page === "home" && (
        <div className="auth-container">
          <div className="brand-icon">₹</div>

          <h1>Budget Planner</h1>
          <h2>Manage Your Money Smartly</h2>

          <p>
            Track your income, expenses and savings in one place.
          </p>

          <button
            onClick={() => {
              setMessage("");
              setPage("signup");
            }}
          >
            Sign Up
          </button>

          <button
            className="secondary-btn"
            onClick={() => {
              setMessage("");
              setPage("login");
            }}
          >
            Login
          </button>
        </div>
      )}

      {/* SIGNUP PAGE */}
      {page === "signup" && (
        <div className="auth-container">
          <h1>Create Account</h1>
          <p>Start managing your money today.</p>

          <form onSubmit={signup}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">
              Create Account
            </button>
          </form>

          <p className="message">{message}</p>

          <p>
            Already registered?
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setMessage("");
                setPage("login");
              }}
            >
              Login
            </button>
          </p>

          <button
            className="secondary-btn"
            onClick={() => setPage("home")}
          >
            Back Home
          </button>
        </div>
      )}

      {/* LOGIN PAGE */}
      {page === "login" && (
        <div className="auth-container">
          <h1>Welcome Back!</h1>
          <p>Login to your Budget Planner account.</p>

          <form onSubmit={login}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">
              Login
            </button>
          </form>

          <p className="message">{message}</p>

          <p>
            New user?
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setMessage("");
                setPage("signup");
              }}
            >
              Sign Up
            </button>
          </p>

          <button
            className="secondary-btn"
            onClick={() => setPage("home")}
          >
            Back Home
          </button>
        </div>
      )}

      {/* DASHBOARD */}
      {page === "dashboard" && currentUser && (
        <div className="dashboard">

          {/* HEADER */}
          <header className="topbar">
            <div>
              <h1>₹ Budget Planner</h1>
              <p>Personal Finance Dashboard</p>
            </div>

            <button
              className="logout-btn"
              onClick={logout}
            >
              Logout
            </button>
          </header>

          {/* WELCOME */}
          <section className="welcome">
            <h2>Welcome, {currentUser.name}!</h2>
            <p>{currentUser.email}</p>
          </section>

          {/* SUMMARY CARDS */}
          <section className="dashboard-cards">

            <motion.div
              className="stat-card income-card"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
            >
              <span>Total Income</span>
              <h2>₹{income.toLocaleString("en-IN")}</h2>
              <p>Your total earnings</p>
            </motion.div>

            <motion.div
              className="stat-card expense-card"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              whileHover={{ scale: 1.03 }}
            >
              <span>Total Expenses</span>
              <h2>₹{totalExpenses.toLocaleString("en-IN")}</h2>
              <p>Your total spending</p>
            </motion.div>

            <motion.div
              className="stat-card balance-card"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              whileHover={{ scale: 1.03 }}
            >
              <span>Remaining Balance</span>
              <h2>₹{balance.toLocaleString("en-IN")}</h2>
              <p>Your available money</p>
            </motion.div>

          </section>

          {/* FINANCIAL HEALTH SCORE */}
          <section
            className="panel"
            style={{
              marginTop: "25px",
              textAlign: "center"
            }}
          >
            <h3>💜 Financial Health Score</h3>

            <p>
              Your financial performance for {formattedMonth}
            </p>

            <div
              style={{
                fontSize: "55px",
                fontWeight: "bold",
                color:
                  financialHealthScore >= 80
                    ? "#16a34a"
                    : financialHealthScore >= 60
                    ? "#2563eb"
                    : financialHealthScore >= 40
                    ? "#f59e0b"
                    : "#dc2626",
                margin: "15px 0"
              }}
            >
              {monthlyTotalIncome > 0
                ? `${financialHealthScore}/100`
                : "--"}
            </div>

            <h2>{healthRating}</h2>

            <div
              className="progress-track"
              style={{
                maxWidth: "500px",
                margin: "20px auto"
              }}
            >
              <div
                className="progress-fill"
                style={{
                  width: `${financialHealthScore}%`,
                  background:
                    financialHealthScore >= 80
                      ? "#16a34a"
                      : financialHealthScore >= 60
                      ? "#2563eb"
                      : financialHealthScore >= 40
                      ? "#f59e0b"
                      : "#dc2626",
                  transition: "width 0.5s ease"
                }}
              ></div>
            </div>

            <p className="summary-note">
              Your score is calculated using savings,
              expense control and monthly budget usage.
            </p>

            {monthlyTotalIncome === 0 && (
              <p className="empty">
                Add income for this month to calculate your score.
              </p>
            )}
          </section>

          {/* SMART SPENDING INSIGHTS */}
          <section
            className="panel"
            style={{
              marginTop: "25px",
              background: "linear-gradient(135deg, #fff1f8, #f3e8ff)",
              border: "1px solid #f0d4ec"
            }}
          >
            <h3>✨ Smart Spending Insights</h3>

            <p>
              Helpful insights based on your {formattedMonth} expenses.
            </p>

            {monthlyExpenses.length === 0 ? (
              <p className="empty">
                Add expenses to discover your spending patterns.
              </p>
            ) : (
              <>
                {/* Highest Spending Category */}
                <div
                  style={{
                    background: "white",
                    padding: "18px",
                    borderRadius: "12px",
                    marginTop: "15px"
                  }}
                >
                  <h4>🏆 Highest Spending Category</h4>

                  <h2 style={{ color: "#9333ea" }}>
                    {highestSpendingCategory[0]}
                  </h2>

                  <h3>
                    ₹{highestSpendingCategory[1].toLocaleString("en-IN")}
                  </h3>

                  <p>
                    {highestCategoryPercentage}% of your monthly expenses
                  </p>
                </div>

                {/* Top Three Categories */}
                <h4 style={{ marginTop: "25px" }}>
                  📊 Your Top Spending Categories
                </h4>

                {topThreeCategories.map(
                  ([cat, amount], index) => {
                    const percentage =
                      monthlyTotalExpenses > 0
                        ? (amount / monthlyTotalExpenses) * 100
                        : 0;

                    return (
                      <div
                        key={cat}
                        style={{
                          background: "white",
                          padding: "15px",
                          borderRadius: "10px",
                          marginTop: "12px"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "10px",
                            flexWrap: "wrap"
                          }}
                        >
                          <strong>
                            {index + 1}. {cat}
                          </strong>

                          <strong>
                            ₹{amount.toLocaleString("en-IN")}
                          </strong>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${percentage}%`,
                              background:
                                chartColors[index % chartColors.length]
                            }}
                          ></div>
                        </div>

                        <p className="summary-note">
                          {percentage.toFixed(1)}% of total monthly expenses
                        </p>
                      </div>
                    );
                  }
                )}

                {/* Automatic Suggestion */}
                <div
                  style={{
                    background: "#ede9fe",
                    color: "#5b21b6",
                    padding: "18px",
                    borderRadius: "12px",
                    marginTop: "20px"
                  }}
                >
                  <h4>💡 Your Spending Suggestion</h4>
                  <p>{spendingInsight}</p>
                </div>
              </>
            )}
          </section>

          {/* DOWNLOAD REPORTS */}
          <section className="panel">
            <h3>📁 Download Financial Reports</h3>

            <p>
              Download your financial data whenever you need it.
            </p>

            <div className="report-buttons">
              <button onClick={downloadPDF}>
                📄 Download PDF Report
              </button>

              <button onClick={downloadExcel}>
                📊 Download Excel Report
              </button>
            </div>
          </section>

          {/* ADD INCOME AND EXPENSE */}
          <section className="forms-grid">

            <div className="panel">
              <h3>＋ Add Income</h3>

              <form onSubmit={addIncome}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter income amount"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                />

                <button type="submit">
                  Add Income
                </button>
              </form>
            </div>

            <div className="panel">
              <h3>－ Add Expense</h3>

              <form onSubmit={addExpense}>
                <input
                  placeholder="Expense name"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                />

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Expense amount"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Food</option>
                  <option>Travel</option>
                  <option>Shopping</option>
                  <option>Education</option>
                  <option>Health</option>
                  <option>Other</option>
                </select>

                <button type="submit">
                  Add Expense
                </button>
              </form>
            </div>

          </section>

          {/* ADVANCED ANALYTICS */}
          <section className="analytics-grid">

            {/* PIE CHART */}
            <div className="panel chart-panel">
              <h3>🥧 Expense Category Distribution</h3>

              {categoryPieData.length === 0 ? (
                <p className="empty">
                  Add expenses to view your chart.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        `₹${Number(value).toLocaleString("en-IN")}`
                      }
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* BAR CHART */}
            <div className="panel chart-panel">
              <h3>📊 Monthly Income vs Expenses</h3>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(value).toLocaleString("en-IN")}`
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="income"
                    fill="#16a34a"
                    name="Income"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="expenses"
                    fill="#ef4444"
                    name="Expenses"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* LINE CHART */}
            <div className="panel chart-panel">
              <h3>📈 Six-Month Spending Trend</h3>

              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(value).toLocaleString("en-IN")}`
                    }
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#9333ea"
                    strokeWidth={3}
                    name="Monthly Expenses"
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* FINANCIAL SUMMARY */}
            <div className="panel">
              <h3>💰 Overall Spending Summary</h3>

              <div className="summary-row">
                <span>Total Income</span>
                <strong>₹{income.toLocaleString("en-IN")}</strong>
              </div>

              <div className="summary-row">
                <span>Total Expenses</span>
                <strong>₹{totalExpenses.toLocaleString("en-IN")}</strong>
              </div>

              <div className="summary-row">
                <span>Available Balance</span>
                <strong>₹{balance.toLocaleString("en-IN")}</strong>
              </div>

              <p className="summary-note">
                All-time totals for your recorded transactions.
              </p>
            </div>

          </section>

          {/* MONTHLY TRACKING */}
          <section className="panel monthly-panel">
            <h3>📅 Monthly Expense Tracking</h3>

            <p>
              Select a month to view your financial report.
            </p>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                const month = e.target.value;

                setSelectedMonth(month);

                setBudgetInput(
                  monthlyBudgets[month]
                    ? String(monthlyBudgets[month])
                    : ""
                );
              }}
            />

            <h3>{formattedMonth} Report</h3>

            <div className="dashboard-cards">

              <div className="stat-card income-card">
                <span>Monthly Income</span>
                <h2>₹{monthlyTotalIncome.toLocaleString("en-IN")}</h2>
              </div>

              <div className="stat-card expense-card">
                <span>Monthly Expenses</span>
                <h2>₹{monthlyTotalExpenses.toLocaleString("en-IN")}</h2>
              </div>

              <div className="stat-card balance-card">
                <span>Monthly Balance</span>
                <h2>₹{monthlyBalance.toLocaleString("en-IN")}</h2>
              </div>

            </div>

            {/* MONTHLY BUDGET */}
            <div className="panel">
              <h3>🎯 Monthly Budget Limit</h3>

              <p>
                Set your spending limit for {formattedMonth}.
              </p>

              <form onSubmit={updateMonthlyBudget}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter monthly budget limit"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                />

                <button type="submit">
                  Save Monthly Budget
                </button>
              </form>

              {selectedMonthBudget > 0 ? (
                <>
                  <div className="summary-row">
                    <span>Monthly Budget</span>
                    <strong>
                      ₹{selectedMonthBudget.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="summary-row">
                    <span>Amount Spent</span>
                    <strong>
                      ₹{monthlyTotalExpenses.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="summary-row">
                    <span>
                      {budgetRemaining >= 0
                        ? "Budget Remaining"
                        : "Amount Over Budget"}
                    </span>

                    <strong>
                      ₹{Math.abs(budgetRemaining).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(budgetUsage, 100)}%`,
                        background:
                          budgetUsage > 100
                            ? "#dc2626"
                            : budgetUsage >= 80
                            ? "#f59e0b"
                            : "#16a34a"
                      }}
                    ></div>
                  </div>

                  <p>
                    {budgetUsage.toFixed(1)}% of your monthly budget used.
                  </p>

                  {budgetUsage > 100 ? (
                    <div
                      style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        padding: "15px",
                        borderRadius: "8px",
                        marginTop: "15px",
                        fontWeight: "bold"
                      }}
                    >
                      ⚠️ Budget Exceeded! You have spent more than your monthly limit.
                    </div>
                  ) : budgetUsage >= 80 ? (
                    <div
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        padding: "15px",
                        borderRadius: "8px",
                        marginTop: "15px",
                        fontWeight: "bold"
                      }}
                    >
                      ⚠️ Warning! You have used 80% or more of your monthly budget.
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "15px",
                        borderRadius: "8px",
                        marginTop: "15px",
                        fontWeight: "bold"
                      }}
                    >
                      ✓ You are within your monthly budget. Keep it up!
                    </div>
                  )}
                </>
              ) : (
                <p className="empty">
                  Set a monthly budget limit to track your spending.
                </p>
              )}
            </div>

            {/* CATEGORY BREAKDOWN */}
            <h3>Monthly Category Breakdown</h3>

            {Object.keys(monthlyCategoryTotals).length === 0 ? (
              <p className="empty">
                No expenses recorded for {formattedMonth}.
              </p>
            ) : (
              Object.entries(monthlyCategoryTotals).map(
                ([cat, amount], index) => (
                  <div className="summary-row" key={cat}>
                    <span>
                      <span
                        style={{
                          display: "inline-block",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: chartColors[index % chartColors.length],
                          marginRight: "8px"
                        }}
                      ></span>
                      {cat}
                    </span>

                    <strong>
                      ₹{amount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                )
              )
            )}

            {/* MONTHLY TRANSACTIONS */}
            <h3>Transactions for {formattedMonth}</h3>

            {monthlyExpenses.length === 0 ? (
              <p className="empty">
                No monthly transactions available.
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Expense</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {monthlyExpenses.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td>
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </td>
                        <td>{getDisplayDate(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </section>

          {/* SAVINGS GOAL */}
          <section className="panel savings-panel">
            <h3>My Savings Goal</h3>

            <form onSubmit={updateGoal}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter your savings target"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
              />

              <button type="submit">
                Set Goal
              </button>
            </form>

            {savingsGoal > 0 && (
              <>
                <div className="summary-row">
                  <span>
                    Goal: ₹{savingsGoal.toLocaleString("en-IN")}
                  </span>

                  <strong>{savingsProgress.toFixed(1)}%</strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${savingsProgress}%`
                    }}
                  ></div>
                </div>

                <p className="summary-note">
                  Progress is based on your current remaining balance.
                </p>
              </>
            )}
          </section>

          {/* INCOME HISTORY */}
          <section className="panel history-panel">
            <h3>Income History</h3>

            {incomeHistory.length === 0 ? (
              <p className="empty">
                No income added yet.
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Income Amount</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {incomeHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </td>

                        <td>{getDisplayDate(item)}</td>

                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteIncome(item.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* EXPENSE HISTORY WITH SEARCH AND FILTER */}
          <section className="panel history-panel">
            <h3>Expense History</h3>

            <div className="expense-filters">
              <input
                type="text"
                placeholder="🔍 Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Shopping">Shopping</option>
                <option value="Education">Education</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("All");
                }}
              >
                Reset Filters
              </button>
            </div>

            {filteredExpenses.length === 0 ? (
              <p className="empty">
                No matching expenses found.
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Expense</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredExpenses.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.category}</td>

                        <td>
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </td>

                        <td>{getDisplayDate(item)}</td>

                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteExpense(item.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* FOOTER */}
          <footer>
            <p>
              © 2026 Budget Planner | Manage Your Money Smartly
            </p>
          </footer>

        </div>
      )}
    </div>
  );
}

export default App;