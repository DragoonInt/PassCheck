document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("password");
  const toggle = document.getElementById("toggle");
  const eyeOpen = document.getElementById("eye-open");
  const eyeClosed = document.getElementById("eye-closed");
  const strengthText = document.getElementById("strength-text");
  const timeText = document.getElementById("time-to-crack");
  const progressFill = document.querySelector(".progress-fill");
  const feedback = document.getElementById("feedback");
  const generateBtn = document.getElementById("generate");
  const copyBtn = document.getElementById("copy");
  const copyText = document.querySelector(".copy-text");
  const copyCheck = document.querySelector(".copy-check");
  const generatedBox = document.getElementById("generated");
  const generatedPass = document.getElementById("generated-password");
  const themeBtn = document.getElementById("theme-toggle");
  const themeSun = document.getElementById("theme-sun");
  const themeMoon = document.getElementById("theme-moon");

  let currentPassword = "";

  // === ТЕМА ===
  const saved = await chrome.storage.sync.get("theme");
  const isDark = saved.theme !== "light";
  document.body.classList.toggle("dark", isDark);
  document.body.classList.toggle("light", !isDark);
  themeSun.classList.toggle("hidden", isDark);
  themeMoon.classList.toggle("hidden", !isDark);

  themeBtn.addEventListener("click", async () => {
    const newIsDark = !document.body.classList.contains("dark");
    themeBtn.classList.add("switching");
    setTimeout(() => themeBtn.classList.remove("switching"), 400);

    document.body.classList.toggle("dark", newIsDark);
    document.body.classList.toggle("light", !newIsDark);
    themeSun.classList.toggle("hidden", newIsDark);
    themeMoon.classList.toggle("hidden", !newIsDark);
    await chrome.storage.sync.set({ theme: newIsDark ? "dark" : "light" });
  });

  // === ГЛАЗ ===
  toggle.addEventListener("click", () => {
    const isPass = input.type === "password";
    input.type = isPass ? "text" : "password";
    eyeOpen.classList.toggle("hidden", !isPass);
    eyeClosed.classList.toggle("hidden", isPass);
  });

  // === ПОЛНЫЙ ПЕРЕВОД ZXCvbn ===
  const translations = {
    // Предупреждения
    "This is a very common password.": "Это очень популярный пароль.",
    "This is a commonplace password.": "Это обычный пароль.",
    "This is similar to a commonly used password.":
      "Этот пароль похож на популярный.",
    "A word by itself is easy to guess.": "Одно слово легко угадать.",
    "Names and surnames by themselves are easy to guess.":
      "Имя или фамилия легко угадываются.",
    "Common names and surnames are easy to guess.":
      "Обычные имена и фамилии легко угадать.",
    "Short keyboard patterns are easy to guess.":
      "Короткие комбинации на клавиатуре легко угадать.",
    'Repeats like "aaa" are easy to guess.':
      'Повторы вроде "aaa" легко угадать.',
    'Repeats like "abcabcabc" are only slightly harder to guess than "abc".':
      'Повторы вроде "abcabcabc" лишь немного сложнее, чем "abc".',
    'Sequences like "abc" or "6543" are easy to guess.':
      'Последовательности вроде "abc" или "6543" легко угадать.',
    "Recent years are easy to guess.": "Недавние годы легко угадать.",
    "Dates are easy to guess.": "Даты легко угадать.",
    "This is a top-10 common password.":
      "Это один из 10 самых популярных паролей.",
    "This is a top-100 common password.":
      "Это один из 100 самых популярных паролей.",
    "Straight rows of keys are easy to guess.":
      "Ряды клавиш на клавиатуре легко угадать.",

    // Советы
    "Add another word or two. Uncommon words are better.":
      "Добавьте ещё 1–2 редких слова.",
    "Use a longer keyboard pattern with more turns.":
      "Используйте длинную комбинацию с поворотами.",
    "Avoid repeated words and characters.":
      "Избегайте повторяющихся слов и символов.",
    'Avoid sequences like "abc" or "6543".':
      'Избегайте последовательностей вроде "abc" или "6543".',
    "Avoid recent years.": "Избегайте недавних годов.",
    "Avoid years that are associated with you.":
      "Избегайте годов, связанных с вами.",
    "Capitalization doesn't help very much.": "Заглавные буквы слабо помогают.",
    "All-uppercase is almost as easy to guess as all-lowercase.":
      "Всё заглавными — почти как строчными.",
    "Reversed words aren't much harder to guess.":
      "Слова задом наперёд не сложнее.",
    'Predictable substitutions like "@" instead of "a" don\'t help very much.':
      'Предсказуемые замены вроде "@" вместо "a" не помогают.',
    "Avoid short keyboard patterns.":
      "Избегайте коротких комбинаций на клавиатуре.",
    "Avoid dates and years that are associated with you.":
      "Избегайте дат и годов, связанных с вами.",
    "Avoid sequences.": "Избегайте последовательностей.",
  };

  function translate(text) {
    return translations[text] || text;
  }

  // === КРАСИВОЕ ВРЕМЯ ВЗЛОМА ===
  function formatCrackTime(seconds) {
    if (seconds < 1) return "мгновенно";
    if (seconds < 60) return `${Math.round(seconds)} сек`;

    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.round(minutes)} мин`;

    const hours = minutes / 60;
    if (hours < 24) return `${Math.round(hours)} ч`;

    const days = hours / 24;
    if (days < 365) return `${Math.round(days)} дн`;

    const years = days / 365;
    if (years < 1000) return `${Math.round(years)} лет`;

    const thousandYears = Math.floor(years / 1000);
    if (thousandYears < 1000) {
      return `${thousandYears} 000+ лет`;
    }

    const millionYears = Math.floor(years / 1_000_000);
    if (millionYears < 1000) {
      return `${millionYears} млн+ лет`;
    }

    const billionYears = Math.floor(years / 1_000_000_000);
    if (billionYears < 1000) {
      return `${billionYears} млрд+ лет`;
    }

    return "∞ лет";
  }

  // === ОБНОВЛЕНИЕ ===
  function update(password) {
    if (!password) {
      strengthText.textContent = "—";
      timeText.textContent = "";
      progressFill.parentElement.className = "progress";
      feedback.innerHTML = "";
      copyBtn.disabled = true;
      generatedBox.classList.add("hidden");
      copyBtn.classList.remove("copied");
      return;
    }

    const result = zxcvbn(password);
    const score = result.score;
    const labels = [
      "Очень слабый",
      "Слабый",
      "Средний",
      "Сильный",
      "Очень сильный",
    ];

    strengthText.textContent = labels[score];
    timeText.textContent = `Взлом: ${formatCrackTime(result.crack_times_seconds.offline_slow_hashing_1e4_per_second)}`;
    progressFill.parentElement.className = `progress strength-${score}`;

    feedback.innerHTML = "";
    if (result.feedback.warning) {
      const li = document.createElement("li");
      li.textContent = translate(result.feedback.warning);
      feedback.appendChild(li);
    }
    result.feedback.suggestions.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = translate(s);
      feedback.appendChild(li);
    });

    currentPassword = password;
    copyBtn.disabled = false;
  }

  input.addEventListener("input", () => update(input.value));

  // === РАЗНООБРАЗНАЯ ГЕНЕРАЦИЯ ===
  generateBtn.addEventListener("click", () => {
    const length = 16;
    const sets = {
      lower: "abcdefghijklmnopqrstuvwxyz",
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      digits: "0123456789",
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    };

    let password = "";
    let allChars = "";

    // Гарантируем по 1 символу из каждой группы
    password += sets.lower[Math.floor(Math.random() * sets.lower.length)];
    password += sets.upper[Math.floor(Math.random() * sets.upper.length)];
    password += sets.digits[Math.floor(Math.random() * sets.digits.length)];
    password += sets.symbols[Math.floor(Math.random() * sets.symbols.length)];

    // Остальные символы — из всех наборов
    allChars = sets.lower + sets.upper + sets.digits + sets.symbols;
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Перемешивание по алгоритму Фишера-Йетса
    const arr = password.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const shuffled = arr.join("");

    generatedPass.textContent = shuffled;
    generatedBox.classList.remove("hidden");
    copyBtn.disabled = false;
    currentPassword = shuffled;
  });

  // === КОПИРОВАНИЕ ===
  copyBtn.addEventListener("click", async () => {
    const text = generatedBox.classList.contains("hidden")
      ? currentPassword
      : generatedPass.textContent;
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add("copied");
    setTimeout(() => copyBtn.classList.remove("copied"), 2000);
  });

  update("");
});
