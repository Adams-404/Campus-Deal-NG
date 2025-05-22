// A lightweight spell checker for search queries

// Common marketplace-related words to check against
const dictionary = [
  // Electronics
  'phone', 'smartphone', 'laptop', 'computer', 'tablet', 'headphones', 'earbuds',
  'television', 'tv', 'monitor', 'camera', 'speaker', 'bluetooth', 'wireless',
  'charger', 'accessory', 'accessories', 'gadget', 'console', 'gaming',
  
  // Clothing
  'shirt', 'pants', 'jeans', 'dress', 'jacket', 'coat', 'sweater', 'hoodie',
  'shoes', 'sneakers', 'boots', 'sandals', 'hat', 'cap', 'socks', 'underwear',
  'suit', 'tie', 'watch', 'jewelry', 'bag', 'backpack', 'handbag', 'purse',
  
  // Home & Kitchen
  'furniture', 'sofa', 'couch', 'chair', 'table', 'desk', 'bed', 'mattress',
  'kitchen', 'appliance', 'refrigerator', 'fridge', 'microwave', 'blender',
  'cookware', 'utensil', 'plate', 'cup', 'glass', 'knife', 'fork', 'spoon',
  
  // Books & Media
  'book', 'textbook', 'novel', 'magazine', 'comic', 'music', 'album', 'movie',
  'video', 'dvd', 'bluray', 'game', 'games', 'controller',
  
  // Services
  'delivery', 'service', 'repair', 'tutor', 'tutoring', 'cleaning', 'catering',
  
  // Condition & Quality
  'new', 'used', 'like', 'good', 'excellent', 'poor', 'broken', 'sealed',
  'unopened', 'original', 'authentic', 'genuine', 'fake', 'damaged',
  
  // Price related
  'cheap', 'expensive', 'affordable', 'price', 'discount', 'deal', 'offer',
  'negotiable', 'fixed', 'obo', 'trade', 'sell', 'buy', 'rent', 'lease',
  
  // Common Nigerian terms
  'naira', 'lagos', 'abuja', 'port', 'harcourt', 'ibadan', 'kano', 'benin',
  'calabar', 'warri', 'nigeria', 'nigerian', 'original',
];

// Levenshtein distance calculation
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Function to find closest matches to a word
export function findClosestMatches(word: string, maxDistance = 2): string[] {
  if (!word || word.length < 3) return [];
  
  const normalizedWord = word.toLowerCase().trim();
  
  // If the word is already in the dictionary, no need for correction
  if (dictionary.includes(normalizedWord)) {
    return [];
  }
  
  // Find all words in the dictionary with a Levenshtein distance <= maxDistance
  const matches = dictionary
    .filter(dictWord => {
      // Only consider words of similar length to avoid irrelevant matches
      if (Math.abs(dictWord.length - normalizedWord.length) > 3) {
        return false;
      }
      
      const distance = levenshteinDistance(normalizedWord, dictWord);
      return distance <= maxDistance && distance > 0; // Ensure it's not an exact match
    })
    .sort((a, b) => {
      const distA = levenshteinDistance(normalizedWord, a);
      const distB = levenshteinDistance(normalizedWord, b);
      return distA - distB; // Sort by distance (closest first)
    });
  
  return matches.slice(0, 3); // Return top 3 matches
}

// Check if a query has any spelling mistakes and suggest corrections
export function checkSpelling(query: string): string | null {
  if (!query || query.length < 3) return null;
  
  const words = query.toLowerCase().split(/\s+/);
  let hasCorrection = false;
  const correctedWords = words.map(word => {
    // Skip very short words or numbers
    if (word.length < 3 || !isNaN(Number(word))) {
      return word;
    }
    
    const matches = findClosestMatches(word);
    if (matches.length > 0) {
      hasCorrection = true;
      return matches[0]; // Use the closest match
    }
    return word;
  });
  
  if (!hasCorrection) return null;
  
  const correctedQuery = correctedWords.join(' ');
  return correctedQuery !== query.toLowerCase() ? correctedQuery : null;
}
