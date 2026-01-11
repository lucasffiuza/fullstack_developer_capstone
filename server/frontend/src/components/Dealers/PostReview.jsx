import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';

const PostReview = () => {
  const { id } = useParams();
  
  const [dealer, setDealer] = useState({});
  const [review, setReview] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carmodels, setCarmodels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize URLs to avoid recalculation
  const rootUrl = useMemo(() => {
    const currUrl = window.location.href;
    return currUrl.substring(0, currUrl.indexOf("postreview"));
  }, []);

  const dealerUrl = useMemo(() => `${rootUrl}djangoapp/dealer/${id}`, [rootUrl, id]);
  const reviewUrl = useMemo(() => `${rootUrl}djangoapp/add_review`, [rootUrl]);
  const carmodelsUrl = useMemo(() => `${rootUrl}djangoapp/get_cars`, [rootUrl]);

  // Get reviewer name from session storage
  const getReviewerName = useCallback(() => {
    const firstName = sessionStorage.getItem("firstname");
    const lastName = sessionStorage.getItem("lastname");
    const username = sessionStorage.getItem("username");
    
    if (firstName && lastName && firstName !== "null" && lastName !== "null") {
      return `${firstName} ${lastName}`;
    }
    return username || "Anonymous";
  }, []);

  // Validate form inputs
  const validateForm = useCallback(() => {
    if (!review.trim()) {
      setError("Review text is required");
      return false;
    }
    if (!date) {
      setError("Purchase date is required");
      return false;
    }
    if (!model) {
      setError("Car make and model are required");
      return false;
    }
    if (!year || year < 2015 || year > 2023) {
      setError("Please enter a valid car year (2015-2023)");
      return false;
    }
    setError("");
    return true;
  }, [review, date, model, year]);

  // Fetch dealer details
  const getDealer = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(dealerUrl, { method: "GET" });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch dealer: ${res.status}`);
      }
      
      const retobj = await res.json();
      
      if (retobj.status === 200 && retobj.dealer) {
        const dealerObjs = Array.from(retobj.dealer);
        if (dealerObjs.length > 0) {
          setDealer(dealerObjs[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching dealer:", err);
      setError("Failed to load dealer information");
    } finally {
      setLoading(false);
    }
  }, [dealerUrl]);

  // Fetch car models
  const getCars = useCallback(async () => {
    try {
      const res = await fetch(carmodelsUrl, { method: "GET" });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch cars: ${res.status}`);
      }
      
      const retobj = await res.json();
      
      if (retobj.CarModels) {
        const carmodelsArr = Array.from(retobj.CarModels);
        setCarmodels(carmodelsArr);
      }
    } catch (err) {
      console.error("Error fetching cars:", err);
      setError("Failed to load car models");
    }
  }, [carmodelsUrl]);

  // Submit review
  const postReview = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const modelSplit = model.split(" ");
      const makeChosen = modelSplit[0];
      const modelChosen = modelSplit.slice(1).join(" "); // Handle multi-word model names

      const reviewData = {
        name: getReviewerName(),
        dealership: id,
        review: review.trim(),
        purchase: true,
        purchase_date: date,
        car_make: makeChosen,
        car_model: modelChosen,
        car_year: parseInt(year, 10),
      };

      const res = await fetch(reviewUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      const json = await res.json();
      
      if (json.status === 200) {
        window.location.href = `${window.location.origin}/dealer/${id}`;
      } else {
        setError(json.message || "Failed to post review. Please try again.");
      }
    } catch (err) {
      console.error("Error posting review:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [review, date, model, year, id, reviewUrl, getReviewerName, validateForm]);

  // Load data on mount
  useEffect(() => {
    getDealer();
    getCars();
  }, [getDealer, getCars]);

  // Get current year for max date validation
  const currentYear = new Date().getFullYear();
  const maxDate = `${currentYear}-12-31`;
  const minDate = "2015-01-01";

  return (
    <div>
      <Header/>
      <div style={{ margin: "5%", maxWidth: "800px", marginLeft: "auto", marginRight: "auto" }}>
        {loading && !dealer.full_name ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Loading dealer information...</p>
          </div>
        ) : (
          <>
            <h1 style={{ color: "darkblue", marginBottom: "2rem" }}>
              {dealer.full_name || "Dealership"}
            </h1>

            {error && (
              <div style={{
                padding: "1rem",
                marginBottom: "1rem",
                backgroundColor: "#fee",
                color: "#c33",
                borderRadius: "4px",
                border: "1px solid #fcc"
              }}>
                {error}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); postReview(); }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="review" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Your Review *
                </label>
                <textarea
                  id="review"
                  cols="50"
                  rows="7"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience with this dealership..."
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "1rem",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div className="input_field" style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="purchase-date" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Purchase Date *
                </label>
                <input
                  id="purchase-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  required
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
                />
              </div>

              <div className="input_field" style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="cars" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Car Make and Model *
                </label>
                <select
                  name="cars"
                  id="cars"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
                >
                  <option value="" disabled>Choose Car Make and Model</option>
                  {carmodels.map((carmodel, index) => (
                    <option key={index} value={`${carmodel.CarMake} ${carmodel.CarModel}`}>
                      {carmodel.CarMake} {carmodel.CarModel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input_field" style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="car-year" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                  Car Year *
                </label>
                <input
                  id="car-year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="2015"
                  max="2023"
                  placeholder="2015-2023"
                  required
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "1rem",
                    width: "200px"
                  }}
                />
              </div>

              <div style={{ marginTop: "2rem" }}>
                <button
                  type="submit"
                  className="postreview"
                  onClick={postReview}
                  disabled={isSubmitting}
                  style={{
                    padding: "0.75rem 2rem",
                    fontSize: "1.1rem",
                    backgroundColor: isSubmitting ? "#ccc" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "background-color 0.3s"
                  }}
                  onMouseOver={(e) => {
                    if (!isSubmitting) e.target.style.backgroundColor = "#0056b3";
                  }}
                  onMouseOut={(e) => {
                    if (!isSubmitting) e.target.style.backgroundColor = "#007bff";
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Post Review"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PostReview;
