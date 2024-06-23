document.addEventListener('DOMContentLoaded', function() {
    let chart;
    let fileData = '';
  
    document.getElementById('fileInput').addEventListener('change', handleFile, false);
    document.getElementById('chartType').addEventListener('change', handleFile, false);
    document.getElementById('askButton').addEventListener('click', handleQuestion, false);
  
    function handleFile() {
      const file = document.getElementById('fileInput').files[0];
      const chartType = document.getElementById('chartType').value;
  
      if (file) {
        console.log('File selected:', file.name);
        const reader = new FileReader();
  
        reader.onload = function(event) {
          console.log('File loaded successfully');
          fileData = btoa(event.target.result);
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          console.log('Parsed JSON Data:', jsonData);
          createChart(jsonData, chartType);
        };
  
        reader.readAsArrayBuffer(file);
      } else {
        console.log('No file selected');
      }
    }
  
    function createChart(data, chartType) {
      if (!data || data.length === 0) {
        console.log('No data to display');
        return;
      }
  
      const labels = data[0].slice(1); // Assuming first row contains column headers
      const datasets = [];
  
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length > 1) {
          const dataset = {
            label: row[0], // Assuming first column contains row headers
            data: row.slice(1),
            fill: false,
            borderColor: getRandomColor(),
            backgroundColor: getRandomColor(),
            tension: 0.1
          };
          datasets.push(dataset);
        }
      }
  
      const ctx = document.getElementById('chartContainer').getContext('2d');
      if (chart) {
        chart.destroy();
      }
      chart = new Chart(ctx, {
        type: chartType,
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Excel Data Analysis'
            }
          }
        }
      });
    }
  
    async function handleQuestion() {
      const question = document.getElementById('question').value.toLowerCase();
      const responseDiv = document.getElementById('response');
  
      if (!fileData) {
        responseDiv.textContent = 'Please upload a file first.';
        return;
      }
  
      try {
        const response = await fetch('http://localhost:3000/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileData, question }),
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch response from server');
        }
  
        const result = await response.json();
        responseDiv.textContent = result.answer;
      } catch (error) {
        console.error(error);
        responseDiv.textContent = 'An error occurred while processing your request.';
      }
    }
  
    function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }
  });
  