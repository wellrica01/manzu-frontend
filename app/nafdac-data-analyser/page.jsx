'use client';
import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, TrendingUp, Package, Pill, Globe } from 'lucide-react';

const NAFDACAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeData = (data) => {
    const products = data.products || [];
    
    // 1. Active Ingredients Analysis
    const ingredientMap = new Map();
    const strengthPatterns = new Map();
    const comboDrugs = [];
    const bracketedIngredients = [];
    
    products.forEach(p => {
      const ingredients = p.activeIngredient.split(';').map(i => i.trim());
      const strengths = p.strength.split(';').map(s => s.trim());
      
      if (ingredients.length > 1) {
        comboDrugs.push({
          brand: p.brandName,
          ingredients: ingredients,
          strengths: strengths
        });
      }
      
      ingredients.forEach((ing, idx) => {
        // Check for bracketed form
        const bracketMatch = ing.match(/^(.+?)\s*\((.+?)\)$/);
        if (bracketMatch) {
          bracketedIngredients.push({
            brand: p.brandName,
            base: bracketMatch[1].trim(),
            active: bracketMatch[2].trim()
          });
          ing = bracketMatch[2].trim(); // Use bracketed form for counting
        }
        
        ingredientMap.set(ing, (ingredientMap.get(ing) || 0) + 1);
        
        // Analyze strength pattern
        const strength = strengths[idx] || strengths[0];
        if (strength) {
          if (strength.includes('/')) {
            strengthPatterns.set('per-unit', (strengthPatterns.get('per-unit') || 0) + 1);
          } else if (strength.includes('%')) {
            strengthPatterns.set('percentage', (strengthPatterns.get('percentage') || 0) + 1);
          } else if (/^\d+(\.\d+)?\s*(mg|g|ml|mcg)/i.test(strength)) {
            strengthPatterns.set('simple', (strengthPatterns.get('simple') || 0) + 1);
          } else {
            strengthPatterns.set('complex', (strengthPatterns.get('complex') || 0) + 1);
          }
        }
      });
    });
    
    // 2. Dosage Forms
    const formMap = new Map();
    products.forEach(p => {
      formMap.set(p.dosageForm, (formMap.get(p.dosageForm) || 0) + 1);
    });
    
    // 3. Manufacturers
    const countryMap = new Map();
    const manufacturerMap = new Map();
    products.forEach(p => {
      if (p.manufacturerCountry) {
        countryMap.set(p.manufacturerCountry, (countryMap.get(p.manufacturerCountry) || 0) + 1);
      }
      if (p.manufacturerName) {
        manufacturerMap.set(p.manufacturerName, (manufacturerMap.get(p.manufacturerName) || 0) + 1);
      }
    });
    
    // 4. Pack Size Patterns
    const packSizePatterns = {
      simple: 0, // "1 x 10"
      complex: 0, // has +, /, "and"
      empty: 0,
      withUnit: 0
    };
    
    products.forEach(p => {
      if (!p.packSize || p.packSize === 'NA' || p.packSize === '') {
        packSizePatterns.empty++;
      } else if (/[\+\/]|and|with/i.test(p.packSize)) {
        packSizePatterns.complex++;
      } else if (/\d+\s*x\s*\d+/i.test(p.packSize)) {
        packSizePatterns.simple++;
        if (/(tablet|capsule|vial|ampoule|ml)/i.test(p.packSize)) {
          packSizePatterns.withUnit++;
        }
      }
    });
    
    // 5. Marketing Category
    const prescriptionMap = new Map();
    products.forEach(p => {
      prescriptionMap.set(p.marketingCategory, (prescriptionMap.get(p.marketingCategory) || 0) + 1);
    });
    
    // Sort and get top 20
    const topIngredients = Array.from(ingredientMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    
    const topForms = Array.from(formMap.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const topCountries = Array.from(countryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    const topManufacturers = Array.from(manufacturerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    return {
      summary: {
        total: products.length,
        comboProducts: comboDrugs.length,
        bracketedIngredients: bracketedIngredients.length,
        uniqueIngredients: ingredientMap.size,
        uniqueForms: formMap.size,
        uniqueCountries: countryMap.size,
        uniqueManufacturers: manufacturerMap.size
      },
      topIngredients,
      topForms,
      topCountries,
      topManufacturers,
      strengthPatterns: Array.from(strengthPatterns.entries()),
      packSizePatterns,
      prescriptionMap: Array.from(prescriptionMap.entries()),
      sampleCombos: comboDrugs.slice(0, 10),
      sampleBracketed: bracketedIngredients.slice(0, 10),
      challenges: identifyChallenges(products, ingredientMap)
    };
  };
  
  const identifyChallenges = (products, ingredientMap) => {
    const challenges = [];
    
    // Check for unusual ingredient names
    const unusual = [];
    ingredientMap.forEach((count, name) => {
      if (name.length > 50) unusual.push(name);
      if (/[^\w\s\(\)\-;,]/i.test(name)) unusual.push(name);
    });
    
    if (unusual.length > 0) {
      challenges.push({
        type: 'unusual_names',
        count: unusual.length,
        samples: unusual.slice(0, 5)
      });
    }
    
    // Check for missing data
    let missingManufacturer = 0;
    let missingPackSize = 0;
    let missingStrength = 0;
    
    products.forEach(p => {
      if (!p.manufacturerName) missingManufacturer++;
      if (!p.packSize || p.packSize === 'NA') missingPackSize++;
      if (!p.strength) missingStrength++;
    });
    
    if (missingManufacturer > 0) {
      challenges.push({
        type: 'missing_manufacturer',
        count: missingManufacturer,
        percentage: ((missingManufacturer / products.length) * 100).toFixed(1)
      });
    }
    
    if (missingPackSize > 0) {
      challenges.push({
        type: 'missing_pack_size',
        count: missingPackSize,
        percentage: ((missingPackSize / products.length) * 100).toFixed(1)
      });
    }
    
    return challenges;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const result = analyzeData(data);
        setAnalysis(result);
        setFile(file.name);
      } catch (error) {
        alert('Error parsing JSON: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            NAFDAC Data Analyzer
          </h1>
          <p className="text-gray-600">
            Upload nafdac_raw.json to analyze scraped medication data
          </p>
        </div>

        {!analysis && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Upload className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                {loading ? 'Analyzing...' : 'Upload nafdac_raw.json'}
              </span>
            </label>
            <p className="text-sm text-gray-500 mt-4">
              Click to browse or drag and drop
            </p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-3xl font-bold text-gray-900">{analysis.summary.total}</p>
                  </div>
                  <Package className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unique Ingredients</p>
                    <p className="text-3xl font-bold text-gray-900">{analysis.summary.uniqueIngredients}</p>
                  </div>
                  <Pill className="w-12 h-12 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Combo Products</p>
                    <p className="text-3xl font-bold text-gray-900">{analysis.summary.comboProducts}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Countries</p>
                    <p className="text-3xl font-bold text-gray-900">{analysis.summary.uniqueCountries}</p>
                  </div>
                  <Globe className="w-12 h-12 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Challenges */}
            {analysis.challenges.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Data Quality Challenges
                    </h3>
                    <ul className="space-y-2">
                      {analysis.challenges.map((c, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          <strong>{c.type.replace(/_/g, ' ').toUpperCase()}:</strong> {c.count} records
                          {c.percentage && ` (${c.percentage}%)`}
                          {c.samples && (
                            <div className="ml-4 mt-1 text-xs text-gray-600">
                              Examples: {c.samples.join(', ')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Top Ingredients */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Top 20 Active Ingredients
              </h3>
              <div className="space-y-2">
                {analysis.topIngredients.map(([name, count], i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{i + 1}. {name}</span>
                    <span className="text-sm font-semibold text-indigo-600">{count} products</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dosage Forms */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Dosage Forms Distribution
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {analysis.topForms.map(([form, count], i) => (
                  <div key={i} className="bg-gray-50 rounded p-3">
                    <p className="text-sm font-medium text-gray-700">{form}</p>
                    <p className="text-2xl font-bold text-indigo-600">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strength Patterns */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Strength Patterns
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analysis.strengthPatterns.map(([pattern, count], i) => (
                  <div key={i} className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-sm text-gray-600 capitalize">{pattern}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pack Size Analysis */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Pack Size Patterns
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analysis.packSizePatterns).map(([pattern, count], i) => (
                  <div key={i} className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-sm text-gray-600 capitalize">{pattern.replace(/_/g, ' ')}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Countries */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Top Manufacturing Countries
              </h3>
              <div className="space-y-2">
                {analysis.topCountries.map(([country, count], i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{i + 1}. {country}</span>
                    <span className="text-sm font-semibold text-green-600">{count} products</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Combo Drugs */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Sample Combination Products ({analysis.summary.comboProducts} total)
              </h3>
              <div className="space-y-3">
                {analysis.sampleCombos.map((combo, i) => (
                  <div key={i} className="bg-gray-50 rounded p-3">
                    <p className="font-medium text-gray-900">{combo.brand}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {combo.ingredients.map((ing, j) => (
                        <span key={j}>
                          {ing} <span className="text-indigo-600">({combo.strengths[j]})</span>
                          {j < combo.ingredients.length - 1 && ' + '}
                        </span>
                      ))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bracketed Ingredients */}
            {analysis.summary.bracketedIngredients > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Sample Bracketed Ingredients ({analysis.summary.bracketedIngredients} total)
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  These show base form with active form in brackets - we'll use the bracketed form for matching.
                </p>
                <div className="space-y-2">
                  {analysis.sampleBracketed.map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded p-3">
                      <p className="text-sm">
                        <span className="text-gray-500">{item.base}</span>
                        {' → '}
                        <span className="text-green-600 font-medium">{item.active}</span>
                        <span className="text-xs text-gray-400 ml-2">({item.brand})</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prescription Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Marketing Categories
              </h3>
              <div className="space-y-2">
                {analysis.prescriptionMap.map(([category, count], i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{category}</span>
                    <span className="text-sm font-semibold text-indigo-600">{count} products</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analysis Complete!
              </h3>
              <p className="text-gray-600 mb-4">
                Your data looks good. Ready to proceed with ingredient matching?
              </p>
              <button
                onClick={() => setAnalysis(null)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition mr-3"
              >
                Analyze Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NAFDACAnalyzer;