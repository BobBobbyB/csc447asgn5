---
title: Interactive Visualization — Study Effort, Attendance, and Academic Performance
---

<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>

<style>
  body {
    font-family: Inter, sans-serif;
    margin: 2rem;
    background-color: #fafafa;
    color: #222;
  }
  svg {
    background: white;
    border: 1px solid #ddd;
  }
  select, input[type="range"] {
    padding: 6px;
    margin: 0.5rem;
  }
  .slider-container {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
  }
  .tooltip {
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 0.9rem;
    pointer-events: none;
    opacity: 0;
  }
</style>

# How Do Study Time and Attendance Relate to Student Grades?

<div class="controls">
  <label><strong>Gender:</strong></label>
  <select id="genderFilter">
    <option value="All">All Genders</option>
    <option value="M">Male</option>
    <option value="F">Female</option>
  </select>

  <div class="slider-container">
    <label><strong>Study Hours Range:</strong></label>
    <input id="minHours" type="range" min="0" max="20" value="0" />
    <input id="maxHours" type="range" min="0" max="20" value="20" />
    <span id="hourLabel">(0–20)</span>
  </div>

  <div class="slider-container">
  <label><strong>Family Income Range:</strong></label>
  <input id="minIncome" type="range" min="0" max="150000" value="0" />
  <input id="maxIncome" type="range" min="0" max="150000" value="150000" />
  <span id="incomeLabel">($0–$150k)</span>
</div>

</div>

<svg id="chart" width="800" height="550"></svg>
<div class="tooltip" id="tooltip"></div>

```js
import * as d3 from "npm:d3";
const data = await FileAttachment("data/student_grades.csv").csv();

// convert categorical grades to numeric scale
const gradeMap = {
  "A+": 100, "A": 95, "A-": 90,
  "B+": 87, "B": 85, "B-": 80,
  "C+": 77, "C": 75, "C-": 70,
  "D": 65, "F": 50
};

data.forEach(d => {
  d.Study_Hours = +d.Study_Hours;
  d.Attendance = +d.Attendance;
  d.Grades = gradeMap[d.Previous_Grades] || 0;
  d.Family_Income = +d.Family_Income || 0;
});

console.log("Extent:", d3.extent(data, d => d.Attendance));
console.log("Mean:", d3.mean(data, d => d.Attendance));
console.log("Income Range:", d3.extent(data, d => d.Family_Income));

const svg = d3.select("#chart");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 50, right: 60, bottom: 70, left: 80 };
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
const tooltip = d3.select("#tooltip");

// scales
let x = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.Study_Hours) * 1.05])
  .range([0, width - margin.left - margin.right]);

let y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.Attendance) * 1.05])
  .range([height - margin.top - margin.bottom, 0]);

const color = d3.scaleThreshold()
  .domain([60, 70, 80, 90, 100])
  .range(["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91cf60"]);

const xAxis = g.append("g")
  .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
  .call(d3.axisBottom(x).ticks(10));
xAxis.append("text")
  .attr("x", (width - margin.left - margin.right) / 2)
  .attr("y", 45)
  .attr("fill", "black")
  .attr("text-anchor", "middle")
  .text("Study Hours");

const yAxis = g.append("g").call(d3.axisLeft(y).ticks(10));
yAxis.append("text")
  .attr("x", -((height - margin.top - margin.bottom) / 2))
  .attr("y", -55)
  .attr("fill", "black")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .text("Attendance (%)");

// legend
const legendData = [
  { grade: "F–D", color: "#d73027" },
  { grade: "C", color: "#fc8d59" },
  { grade: "B", color: "#fee08b" },
  { grade: "A–", color: "#d9ef8b" },
  { grade: "A+", color: "#91cf60" }
];

const legend = svg.append("g")
  .attr("transform", `translate(${width - 260}, ${height - 45})`)
  .attr("font-size", "0.8rem");

legend.selectAll("rect")
  .data(legendData)
  .enter()
  .append("rect")
  .attr("x", (d, i) => i * 35)
  .attr("width", 30)
  .attr("height", 10)
  .attr("fill", d => d.color);

legend.selectAll("text")
  .data(legendData)
  .enter()
  .append("text")
  .attr("x", (d, i) => i * 35 + 15)
  .attr("y", 22)
  .attr("text-anchor", "middle")
  .text(d => d.grade);

legend.append("text")
  .attr("x", 80)
  .attr("y", -8)
  .attr("text-anchor", "middle")
  .attr("font-size", "0.9rem")
  .text("Grades");

// function
function update(gender, minH, maxH, minI, maxI) {
  const filtered = data.filter(d =>
    (gender === "All" || d.Gender === gender) &&
    !isNaN(d.Study_Hours) &&
    !isNaN(d.Attendance) &&
    d.Study_Hours >= minH && d.Study_Hours <= maxH &&
    d.Family_Income >= minI && d.Family_Income <= maxI
  );

  const xExtent = d3.extent(filtered, d => d.Study_Hours);
  const yMax = d3.max(filtered, d => d.Attendance);

  if (xExtent[0] !== undefined && yMax !== undefined) {
    x.domain([xExtent[0] - 0.5, xExtent[1] + 0.5]);
    y.domain([0, yMax * 1.05]);
    xAxis.transition().duration(600).call(d3.axisBottom(x).ticks(8));
    yAxis.transition().duration(600).call(d3.axisLeft(y).ticks(8));
  }

  const circles = g.selectAll("circle").data(filtered, (d, i) => i);

  circles.join(
    enter => enter.append("circle")
      .attr("cx", d => x(d.Study_Hours))
      .attr("cy", d => y(d.Attendance) + (Math.random() - 0.5) * 5)
      .attr("r", 5)
      .attr("fill", d => color(d.Grades))
      .attr("opacity", 0.85)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.6)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition().duration(100)
          .attr("r", 8)
          .attr("stroke-width", 1);

        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(
          `<strong>${d.Gender}</strong><br>
           Grade: ${d.Previous_Grades}<br>
           Study Hours: ${d.Study_Hours}<br>
           Attendance: ${d.Attendance}%<br>
           Income: $${d.Family_Income.toLocaleString()}`
        );

        const tooltipWidth = 180;
        const tooltipHeight = 100;
        const padding = 15;
        let left = event.pageX + padding;
        let top = event.pageY - tooltipHeight - 10;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (left + tooltipWidth > windowWidth)
          left = event.pageX - tooltipWidth - padding;
        if (top < 0)
          top = event.pageY + padding;
        if (top + tooltipHeight > windowHeight)
          top = windowHeight - tooltipHeight - 10;

        tooltip.style("left", `${left}px`).style("top", `${top}px`);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition().duration(200)
          .attr("r", 5)
          .attr("stroke-width", 0.6);
        tooltip.transition().duration(200).style("opacity", 0);
      }),
    update => update.transition().duration(400)
      .attr("cx", d => x(d.Study_Hours))
      .attr("cy", d => y(d.Attendance) + (Math.random() - 0.5) * 5)
      .attr("fill", d => color(d.Grades)),
    exit => exit.remove()
  );
}

// initialize
update("All", 0, 20, 0, d3.max(data, d => d.Family_Income));

// controls
d3.select("#genderFilter").on("change", function() {
  update(
    this.value,
    +d3.select("#minHours").property("value"),
    +d3.select("#maxHours").property("value"),
    +d3.select("#minIncome").property("value"),
    +d3.select("#maxIncome").property("value")
  );
});

d3.selectAll("#minHours, #maxHours, #minIncome, #maxIncome").on("input", function() {
  const minH = +d3.select("#minHours").property("value");
  const maxH = +d3.select("#maxHours").property("value");
  const minI = +d3.select("#minIncome").property("value");
  const maxI = +d3.select("#maxIncome").property("value");
  d3.select("#hourLabel").text(`(${minH}–${maxH})`);
  d3.select("#incomeLabel").text(`($${minI.toLocaleString()}–$${maxI.toLocaleString()})`);
  update(d3.select("#genderFilter").property("value"), minH, maxH, minI, maxI);
});
```

---

# Design Brief

## 1. Dataset Choice
This project uses the **“Factors Affecting University Student Grades”** dataset from Kaggle (Atif Masih, 2023).  
It contains 10,000+ student records, capturing a wide range of behavioral and contextual features including:
- Study hours, attendance, grades  
- Psychological and social variables (motivation, stress, self-esteem)  
- Learning style and parental background  

**Source:**  
[Factors Affecting University Student Grades (Kaggle)](https://www.kaggle.com/datasets/atifmasih/factors-affecting-university-student-grades)

---

## 2. Research Question
**Do higher attendence and higher studying hours correlate to better grades, and how do these relationships vary by gender and family income?**

This visualization explores whether **consistent attendance** and **extended study time** reliable predictors of **strong academic outcomes** actually matters on if students do well in school or not. It also investigates whether **socioeconomic backgrounds** or **gender** influences these correlations, revealing patterns of both effort and equity in **educational success**.

---

## 3. Visual Concept
A **scatterplot** was chosen to map continuous relationships:
- **X-axis:** Study Hours  
- **Y-axis:** Attendance (%)  
- **Color:** Grade (Red -> Green)  
- **Point Size:** (maybe): Student Grade or Performance Score
- **Tooltip:** Displays study hours, attendance, grade, gender, and income level
- **Dropdown Filter:** Allows users to toggle between gender groups (All, Male, Female)

This configuration provides an intuitive, continuous mapping of behavioral effort against performance while minimizing cognitive load and visual clutter.

---

## 4. Interaction Concept
The visualization includes two core interactions:
- Hover Tooltips: Provide “details on demand,” showing each student’s study hours, attendance, grade, gender, and family income.
- Dropdown Filter: Allows users to switch between male, female, and all students, enabling side-by-side comparison of behavioral and performance patterns across genders.


Future extensions could include:
- Filtering by income group
- Adding regression trendlines per gender
- Light zoom/pan capabilities for dense clusters
- These interactions prioritize simplicity while still enabling meaningful exploration of correlations and subgroup differences.

---

## 5. Design Inspirations
- [Ben Fry — Zipdecode](https://www.benfry.com/zipdecode/): for geographic encoding simplicity and minimalist interaction.  
- [Observable Plot D3 Scatter](https://observablehq.com/@d3/gallery): inspiration for data-driven visual mappings.  
- [Namerology Baby Name Grapher](https://namerology.com/baby-name-grapher/): reference for interactive filtering and storytelling through quantitative visuals.  

---

## 6. Reflection
This design visualizes the intersection of **effort**, **opportunity**, and **outcome**.
By mapping study habits and attendance alongside economic background and gender, it reveals how both **individual behavior** and **structural factors** shape academic performance.
The simple interactive controls foster open-ended exploration, allowing users to form their own insights into the balance between **discipline**, **equity**, and **achievement** in education.

---
