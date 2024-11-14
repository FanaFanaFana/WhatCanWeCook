document.addEventListener("DOMContentLoaded", function () {
    const filterInput = document.getElementById("filterInput");
    const filterButton = document.getElementById("filterButton");
    let cachedData = null; // Cache JSON data after the first fetch

    // Debounce function to improve performance by delaying repeated calls
    const debounce = (func, delay) => {
        let debounceTimer;
        return function (...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Function to handle the search functionality
    const handleSearch = debounce(function () {
        const ingredientsInput = filterInput.value.toLowerCase().trim();

        // Check if input is empty or only contains commas or periods
        if (ingredientsInput === "" || /^[,.]+$/.test(ingredientsInput)) {
            const container = document.getElementById("resultsContainer");
            container.innerHTML = "<h1>Please enter valid ingredients to search for recipes.</h1>";
            return;
        }

        const ingredients = ingredientsInput.split(",").map(ing => ing.trim());
        filterButton.disabled = true; // Disable button during processing

        // Load JSON data from cache or fetch if not cached
        (cachedData ? Promise.resolve(cachedData) : fetch("rezepte.json").then(response => response.json()))
            .then(data => {
                if (!cachedData) cachedData = data; // Cache the data if not cached

                // Process each recipe to calculate match percentage and track missing ingredients
                const processedData = data.rezepte.map(recipe => {
                    const missingIngredients = [];
                    const totalIngredients = recipe.ingredients.length;

                    // Calculate match count and track missing ingredients
                    const matchCount = ingredients.filter(ingredient => {
                        const isMatch = recipe.ingredients.some(ing => ing.toLowerCase().includes(ingredient));
                        if (!isMatch) missingIngredients.push(ingredient); // Track missing ingredients
                        return isMatch;
                    }).length;

                    // Calculate the match percentage
                    const matchPercentage = (matchCount / totalIngredients) * 100;

                    return { recipe, matchPercentage, missingIngredients, totalIngredients };
                });

                // Filter out recipes with no matches at all
                const filteredData = processedData.filter(item => item.matchPercentage > 0);

                // Sort recipes by match percentage, then by the number of ingredients, and randomize recipes with the same match percentage
                filteredData.sort((a, b) => {
                    if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
                    if (a.totalIngredients !== b.totalIngredients) return a.totalIngredients - b.totalIngredients;
                    return Math.random() - 0.5;
                });

                // Pass the processed data for display
                displayResults(filteredData, ingredients);
            })
            .catch(error => console.error("Error loading JSON:", error))
            .finally(() => filterButton.disabled = false); // Re-enable button after processing
    }, 300); // 300ms debounce delay

    // Event listener for the filter button
    filterButton.addEventListener("click", handleSearch);

    // Event listener for Enter key on the input field
    filterInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            handleSearch();
        }
    });
});

// Function to display filtered recipes, including missing ingredients and image
function displayResults(data, ingredients) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = "<h1>No recipes found with these ingredients. Make sure to use ',' between ingredients !</h1>";
        return;
    }

    const displayedNames = new Set();

    data.forEach((item, index) => {
        const recipe = item.recipe;
        const matchPercentage = item.matchPercentage;
        const missingIngredients = item.missingIngredients;

        if (displayedNames.has(recipe.name)) return;
        displayedNames.add(recipe.name);

        const article = document.createElement("article");
        article.classList.add("box", "post");

        const highlightedIngredients = recipe.ingredients.map(ingredient => {
            let highlightedIngredient = ingredient;
            ingredients.forEach(ing => {
                if (highlightedIngredient.toLowerCase().includes(ing)) {
                    const regex = new RegExp(`(${ing})`, "gi");
                    highlightedIngredient = highlightedIngredient.replace(regex, `<span class="highlight">$1</span>`);
                }
            });
            return `<li><span class="clickable-ingredient" onclick="addIngredientToSearch('${ingredient}')">${highlightedIngredient}</span></li>`;
        }).join("");

        const missingList = ingredients.filter(ing => !recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(ing)))
            .map(ingredient => `<span class="missing">X ${ingredient}</span>`).join(", ");

        const preparationId = `preparation-${index}`;
        const preparationContainer = `
            <button onclick="togglePreparation('${preparationId}')">Show Preparation</button>
            <div id="${preparationId}" style="display: none; margin-top: 25px;">
                ${recipe.preparation.replace(/\./g, ".<br>").replace(/<br><br>/g, "<br>")}
            </div>
        `;

        const imageTag = recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-image mobile-view-image">` : "";

        article.innerHTML = `
            <header><h2><b>${recipe.name}</b></h2></header><br>
            ${imageTag} <br>
            <p><strong>Ingredients:</strong></p>
            <ul>${highlightedIngredients}</ul>
            <p><strong>Not needed:</strong> ${missingList}</p>
            <p><strong>Matching:</strong> ${matchPercentage.toFixed(2)}%</p>
            ${preparationContainer}
        `;
        container.appendChild(article);
    });
}

function addIngredientToSearch(ingredient) {
    const filterInput = document.getElementById("filterInput");
    const currentIngredients = filterInput.value.toLowerCase().split(",").map(ing => ing.trim());

    if (!currentIngredients.includes(ingredient.toLowerCase())) {
        currentIngredients.push(ingredient);
        filterInput.value = currentIngredients.join(", ");
    }
}

function togglePreparation(preparationId) {
    const preparationDiv = document.getElementById(preparationId);
    const isHidden = preparationDiv.style.display === "none";
    preparationDiv.style.display = isHidden ? "block" : "none";
}
