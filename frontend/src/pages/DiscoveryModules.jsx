import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getFriendlyErrorMessage } from "../utils/errorHelper";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Heart,
  MessageCircle,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Layers,
  Sparkles,
  X,
  Send,
  Eye,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  CardSkeletonLoader,
  ButtonLoader,
  InlineLoader,
} from "../components/NexoraLoader";
import { SpiderOverlayLoader } from "../components/SpiderMascot";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import Modal from "../components/Modal";
import {
  useListingsQuery,
  useCreateListingMutation,
  useDeleteListingMutation,
  useLikeListingMutation,
  useCommentListingMutation,
} from "../api/queries";

const resolveImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http://") || img.startsWith("https://")) {
    return img;
  }
  return `/api/v1/uploads/${img}`;
};

const formatDisplayDate = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) {
      const [year, month, day] = trimmed.split("-").map(Number);
      const parsed = new Date(Date.UTC(year, month - 1, day));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const TMDB_BEARER_TOKEN = `Bearer ${import.meta.env.VITE_TMDB_BEARER_TOKEN}`;

const DiscoveryModules = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Active module based on query parameter
  const activeModule = searchParams.get("module") || "movies";

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterMaxDistance, setFilterMaxDistance] = useState("");

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    itemId: null,
  });

  // Form states
  const [formCategory, setFormCategory] = useState("");
  const [lookupMode, setLookupMode] = useState(true);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState({ db: [], api: [] });
  const [lookupSearching, setLookupSearching] = useState(false);
  const [lookupSearchDone, setLookupSearchDone] = useState(false);
  const [lookupInfoMessage, setLookupInfoMessage] = useState("");
  const [dbCommentTexts, setDbCommentTexts] = useState({});
  const [externalImageUrl, setExternalImageUrl] = useState("");
  const [movieForm, setMovieForm] = useState({
    name: "",
    genre: "",
    language: "",
    ottPlatform: "",
    director: "",
    hero: "",
    heroine: "",
    releaseDate: "",
    rating: "",
  });
  const [seriesForm, setSeriesForm] = useState({
    name: "",
    genre: "",
    language: "",
    ottPlatform: "",
    director: "",
    leadCast: "",
    seasons: "",
    releaseDate: "",
    rating: "",
  });
  const [gameForm, setGameForm] = useState({
    name: "",
    genre: "",
    platform: "",
  });
  const [placeForm, setPlaceForm] = useState({
    name: "",
    location: "",
    entryPrice: "",
    distanceKm: "",
    details: "",
  });
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    location: "",
    specialItems: "",
    priceRange: "$$",
  });

  const [formFiles, setFormFiles] = useState([]);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Comments inside detail modal
  const [detailComment, setDetailComment] = useState("");

  // Committed filter values for query
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    genre: "",
    language: "",
    platform: "",
    maxPrice: "",
    maxDistance: "",
  });

  // Dynamic filter resolver for TanStack Query
  const getListingParams = () => {
    const params = { search: appliedFilters.search };
    if (activeModule === "movies" || activeModule === "webseries") {
      params.genre = appliedFilters.genre;
      params.language = appliedFilters.language;
      params.ottPlatform = appliedFilters.platform;
    } else if (activeModule === "games") {
      params.genre = appliedFilters.genre;
      params.platform = appliedFilters.platform;
    } else if (activeModule === "places") {
      params.maxPrice = appliedFilters.maxPrice || null;
      params.maxDistance = appliedFilters.maxDistance || null;
    } else if (activeModule === "restaurants") {
      params.priceRange = appliedFilters.platform || null;
    }
    return params;
  };

  // Social stats & states (TanStack Query)
  const { data: items = [], isLoading: loading } = useListingsQuery(
    activeModule,
    getListingParams(),
  );
  const createListingMutation = useCreateListingMutation(activeModule);
  const deleteListingMutation = useDeleteListingMutation(activeModule);
  const likeListingMutation = useLikeListingMutation(activeModule);
  const commentListingMutation = useCommentListingMutation(activeModule);

  const formLoading =
    createListingMutation.isPending || deleteListingMutation.isPending;
  const loaderMessage = createListingMutation.isPending
    ? "Uploading your recommendation..."
    : deleteListingMutation.isPending
      ? "Deleting recommendation..."
      : "";

  // Auto reset search filters and close modals when switching modules
  useEffect(() => {
    resetFilters();
    setIsUploadOpen(false);
    setIsDetailOpen(false);
    setSelectedItem(null);
  }, [activeModule]);

  const loadListings = () => {
    setAppliedFilters({
      search: searchQuery,
      genre: filterGenre,
      language: filterLanguage,
      platform: filterPlatform,
      maxPrice: filterMaxPrice,
      maxDistance: filterMaxDistance,
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterGenre("");
    setFilterLanguage("");
    setFilterPlatform("");
    setFilterMaxPrice("");
    setFilterMaxDistance("");
    setFormError("");
    setAppliedFilters({
      search: "",
      genre: "",
      language: "",
      platform: "",
      maxPrice: "",
      maxDistance: "",
    });
  };

  // Open upload modal with preconfigured category
  const openUploadModal = () => {
    setFormError("");
    setFormSuccess("");
    setFormFiles([]);
    setIsUploadOpen(true);

    // Reset lookup states
    setLookupMode(true);
    setLookupQuery("");
    setLookupResults({ db: [], api: [] });
    setLookupSearching(false);
    setLookupSearchDone(false);
    setExternalImageUrl("");
    setDbCommentTexts({});

    // Autofill expected category
    if (activeModule === "movies") setFormCategory("Movie");
    else if (activeModule === "webseries") setFormCategory("Web Series");
    else if (activeModule === "games") setFormCategory("Game");
    else if (activeModule === "places") setFormCategory("Place");
    else if (activeModule === "restaurants") setFormCategory("Restaurant");
  };

  // Debounce search after each character is entered
  useEffect(() => {
    if (!isUploadOpen || !lookupMode) return;

    const query = lookupQuery.trim();
    if (!query) {
      setLookupResults({ db: [], api: [] });
      setLookupSearchDone(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleLookupSearch();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [lookupQuery, activeModule, isUploadOpen, lookupMode]);

  const resolveTmdbGenres = (genreIds = []) => {
    const TMDB_GENRES = {
      28: "Action",
      12: "Adventure",
      16: "Animation",
      35: "Comedy",
      80: "Crime",
      99: "Documentary",
      18: "Drama",
      10751: "Family",
      14: "Fantasy",
      36: "History",
      27: "Horror",
      10402: "Music",
      9648: "Mystery",
      10749: "Romance",
      878: "Science Fiction",
      10770: "TV Movie",
      53: "Thriller",
      10752: "War",
      37: "Western",
      10759: "Action & Adventure",
      10762: "Kids",
      10763: "News",
      10764: "Reality",
      10765: "Sci-Fi & Fantasy",
      10766: "Soap",
      10767: "Talk",
      10768: "War & Politics",
    };
    return genreIds.map((id) => TMDB_GENRES[id]).filter(Boolean);
  };

  const resolveTmdbLanguage = (langCode) => {
    const LANG_CODES = {
      en: "English",
      hi: "Hindi",
      te: "Telugu",
      ta: "Tamil",
      es: "Spanish",
      fr: "French",
      ja: "Japanese",
      ko: "Korean",
      ml: "Malayalam",
      kn: "Kannada",
    };
    return LANG_CODES[langCode] || langCode?.toUpperCase() || "Unknown";
  };

  const fetchTmdbItemDetails = async (id, isMovie) => {
    const endpoint = isMovie ? "movie" : "tv";
    const url = `https://api.themoviedb.org/3/${endpoint}/${id}?append_to_response=credits,watch/providers&language=en-US`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: TMDB_BEARER_TOKEN,
      },
    });
    if (!res.ok) return null;
    return res.json();
  };

  const placeLookupInfoMessage = (message) => {
    setLookupInfoMessage(message);
    window.setTimeout(() => {
      setLookupInfoMessage("");
    }, 5000);
  };

  const handleLookupSearch = async () => {
    const query = lookupQuery.trim();
    if (!query) return;
    setLookupSearching(true);
    setFormError("");
    setLookupInfoMessage("");
    try {
      // Search local database
      const dbRes = await axios.get(`/api/v1/${activeModule}`, {
        params: { search: query },
      });
      let dbMatches = dbRes.data || [];

      // Search public TMDB API only for movies and web series
      let apiMatches = [];
      if (activeModule === "movies" || activeModule === "webseries") {
        const isMovie = activeModule === "movies";
        const searchUrl = isMovie
          ? `https://api.themoviedb.org/3/search/movie?include_adult=false&language=en-US&page=1&query=${encodeURIComponent(query)}`
          : `https://api.themoviedb.org/3/search/tv?include_adult=false&language=en-US&page=1&query=${encodeURIComponent(query)}`;

        const searchRes = await fetch(searchUrl, {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: TMDB_BEARER_TOKEN,
          },
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const rawResults = searchData.results || [];

          const detailedResults = await Promise.all(
            rawResults.slice(0, 8).map(async (item) => {
              const details = await fetchTmdbItemDetails(item.id, isMovie);
              if (!details) return null;

              const genres = isMovie
                ? resolveTmdbGenres(details.genre_ids || details.genres?.map((g) => g.id))
                : resolveTmdbGenres(details.genre_ids || details.genres?.map((g) => g.id));

              const language = resolveTmdbLanguage(details.original_language);
              const posterPath = details.poster_path || item.poster_path || details.backdrop_path;
              const posterUrl = posterPath
                ? `https://image.tmdb.org/t/p/w500${posterPath}`
                : "";

              const directorCrew = (details.credits?.crew || []).filter(
                (crew) => crew.job === "Director",
              );
              const director = directorCrew.length > 0
                ? directorCrew[0].name
                : "Unknown";

              const cast = details.credits?.cast || [];
              const hero = cast.length > 0 ? cast[0].name : "N/A";
              const heroine = cast.length > 1 ? cast[1].name : "N/A";
              const castList = cast.slice(0, 4).map((member) => member.name);

              let ottPlatform = "Unknown";
              const providerData = details['watch/providers']?.results || {};
              const providerRegions = providerData.US || providerData.IN || providerData.GB || providerData.DE || providerData.CA;
              if (providerRegions) {
                const providerSources = [
                  ...(providerRegions.flatrate || []),
                  ...(providerRegions.rent || []),
                  ...(providerRegions.buy || []),
                ];
                if (providerSources.length > 0) {
                  ottPlatform = [...new Set(providerSources.map((p) => p.provider_name))].join(", ");
                }
              }

              return {
                id: item.id,
                name: isMovie ? details.title || item.title : details.name || item.name,
                genres,
                language,
                premiered: isMovie ? details.release_date : details.first_air_date,
                image: {
                  medium: posterUrl,
                  original: posterUrl,
                },
                rating: details.vote_average || item.vote_average,
                ottPlatform,
                director,
                hero,
                heroine,
                castList,
              };
            }),
          );

          apiMatches = detailedResults.filter(Boolean);

          if (
            apiMatches.length > 0 &&
            apiMatches.every(
              (match) =>
                match.ottPlatform === "Unknown" &&
                match.director === "Unknown" &&
                (match.hero === "N/A" || !match.hero) &&
                (match.heroine === "N/A" || !match.heroine),
            )
          ) {
            placeLookupInfoMessage(
              "Movie details not found. Please enter details manually below.",
            );
          }
        }
      }

      setLookupResults({ db: dbMatches, api: apiMatches });
      setLookupSearchDone(true);
    } catch (err) {
      console.error("Lookup search error:", err);
      const msg = getFriendlyErrorMessage(err, "Failed to perform search. Please try again.");
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setLookupSearching(false);
    }
  };

  const handleDbInlineComment = async (itemId, text) => {
    if (!text || !text.trim()) return;
    setFormError("");
    setFormSuccess("");

    commentListingMutation.mutate(
      { itemId, text },
      {
        onSuccess: () => {
          setFormSuccess("Comment added successfully!");
          showToast(
            "Review comment posted to existing recommendation!",
            "success",
          );
          setTimeout(() => {
            setIsUploadOpen(false);
          }, 1000);
        },
        onError: (err) => {
          const msg = err.response?.data || "Failed to submit comment.";
          setFormError(msg);
          showToast(msg, "error");
        },
      },
    );
  };

  const handleImportSelect = (item) => {
    console.log("Importing item from TMDB/public API:", item);
    const name = item.name || "";
    const genres =
      item.genres && Array.isArray(item.genres) ? item.genres.join(", ") : "";
    const language = item.language || "";
    const ottPlatform = item.ottPlatform || item.webChannel?.name || item.network?.name || "Unknown";
    const releaseDate = item.premiered || "";
    const posterUrl = item.image?.medium || item.image?.original || "";
    const rating =
      item.rating !== undefined && item.rating !== null ? item.rating : "";
    const director = item.director || "Unknown";
    const hero = item.hero || "N/A";
    const heroine = item.heroine || "N/A";
    const leadCast = item.leadCast || "Unknown";

    console.log("Mapped fields:", {
      name,
      genres,
      language,
      ottPlatform,
      director,
      hero,
      heroine,
      leadCast,
      releaseDate,
      posterUrl,
      rating,
    });

    if (activeModule === "movies" || formCategory === "Movie") {
      console.log("Populating movie form state...");
      setMovieForm({
        name,
        genre: genres,
        language,
        ottPlatform,
        director,
        hero,
        heroine,
        releaseDate,
        rating,
      });
    } else if (activeModule === "webseries" || formCategory === "Web Series") {
      console.log("Populating webseries form state...");
      setSeriesForm({
        name,
        genre: genres,
        language,
        ottPlatform,
        director,
        leadCast,
        seasons: 1,
        releaseDate,
        rating,
      });
    }

    setExternalImageUrl(posterUrl);
    setLookupMode(false);

    const missingDetails =
      ottPlatform === "Unknown" ||
      director === "Unknown" ||
      (activeModule === "movies" && (hero === "N/A" || heroine === "N/A")) ||
      (activeModule === "webseries" && leadCast === "Unknown");

    if (missingDetails) {
      showToast(
        "Some details were not available from TMDB. Please enter unknown fields manually.",
        "info",
      );
    } else {
      showToast(
        `Imported "${name}". Please review details below before submitting.`,
        "success",
      );
    }
  };

  // Perform upload submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const formData = new FormData();
    formData.append("contentType", formCategory); // Triggers Category Guard Check!

    if (activeModule === "movies") {
      Object.keys(movieForm).forEach((k) => {
        if (movieForm[k] !== undefined && movieForm[k] !== null && movieForm[k] !== "") {
          formData.append(k, movieForm[k]);
        }
      });
      if (formFiles[0]) formData.append("poster", formFiles[0]);
      if (externalImageUrl) formData.append("posterUrl", externalImageUrl);
    } else if (activeModule === "webseries") {
      Object.keys(seriesForm).forEach((k) => {
        if (seriesForm[k] !== undefined && seriesForm[k] !== null && seriesForm[k] !== "") {
          formData.append(k, seriesForm[k]);
        }
      });
      if (formFiles[0]) formData.append("poster", formFiles[0]);
      if (externalImageUrl) formData.append("posterUrl", externalImageUrl);
    } else if (activeModule === "games") {
      Object.keys(gameForm).forEach((k) => {
        if (gameForm[k] !== undefined && gameForm[k] !== null && gameForm[k] !== "") {
          formData.append(k, gameForm[k]);
        }
      });
      if (formFiles[0]) formData.append("cover", formFiles[0]);
      if (externalImageUrl) formData.append("coverUrl", externalImageUrl);
    } else if (activeModule === "places") {
      Object.keys(placeForm).forEach((k) => {
        if (placeForm[k] !== undefined && placeForm[k] !== null && placeForm[k] !== "") {
          formData.append(k, placeForm[k]);
        }
      });
      formFiles.forEach((file) => formData.append("photo", file));
    } else if (activeModule === "restaurants") {
      Object.keys(restaurantForm).forEach((k) => {
        if (restaurantForm[k] !== undefined && restaurantForm[k] !== null && restaurantForm[k] !== "") {
          formData.append(k, restaurantForm[k]);
        }
      });
      formFiles.forEach((file) => formData.append("menu", file));
    }

    console.log("Submitting formData with keys & values:");
    for (let pair of formData.entries()) {
      console.log(`  ${pair[0]}:`, pair[1]);
    }

    createListingMutation.mutate(formData, {
      onSuccess: () => {
        setFormSuccess("Uploaded successfully!");
        showToast("Recommendation uploaded successfully!", "success");
        setTimeout(() => {
          setIsUploadOpen(false);
        }, 1000);
      },
      onError: (error) => {
        const msg = getFriendlyErrorMessage(error, "Failed to submit listing. Verify all required fields.");
        setFormError(msg);
        showToast(msg, "error");
      },
    });
  };

  // Delete Listing Click Trigger
  const handleDeleteItemClick = (itemId, e) => {
    e.stopPropagation(); // Avoid opening details modal
    setDeleteConfirm({ isOpen: true, itemId });
  };

  // Perform actual deletion
  const handleConfirmDelete = () => {
    if (!deleteConfirm.itemId) return;
    deleteListingMutation.mutate(deleteConfirm.itemId, {
      onSuccess: () => {
        showToast("Listing deleted successfully.", "success");
        setDeleteConfirm({ isOpen: false, itemId: null });
      },
      onError: (error) => {
        const msg = getFriendlyErrorMessage(error, "Failed to delete.");
        showToast(msg, "error");
        setDeleteConfirm({ isOpen: false, itemId: null });
      },
    });
  };

  // Like Listing
  const handleLikeItem = async (itemId, e) => {
    if (e) e.stopPropagation();
    likeListingMutation.mutate(itemId, {
      onSuccess: (updatedItem) => {
        if (selectedItem && selectedItem.id === itemId) {
          setSelectedItem(updatedItem);
        }
      },
    });
  };

  // Comment on Listing
  const handleCommentItem = async () => {
    if (!detailComment.trim() || !selectedItem) return;
    const itemId = selectedItem.id;
    commentListingMutation.mutate(
      { itemId, text: detailComment },
      {
        onSuccess: (updatedItem) => {
          setSelectedItem(updatedItem);
          setDetailComment("");
          // showToast("Review comment posted!", "success");
        },
        onError: () => {
          showToast("Failed to add comment.", "error");
        },
      },
    );
  };

  // Helper to extract clean image filename property
  const getItemImgProperty = (item) => {
    if (!item) return [];
    let val = null;
    if (item.posterUrl) val = item.posterUrl;
    else if (item.coverUrl) val = item.coverUrl;
    else if (item.photoUrl) val = item.photoUrl;
    else if (item.menuImageUrl) val = item.menuImageUrl;

    if (val) {
      return val.split(",");
    }
    return [];
  };

  const ModalImageCarousel = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;
    if (images.length === 1) {
      return (
        <img
          src={resolveImageUrl(images[0])}
          alt="Preview"
          className="w-full h-full object-cover"
        />
      );
    }

    return (
      <div className="relative w-full h-full group">
        <img
          src={resolveImageUrl(images[currentIndex])}
          alt="Preview"
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        <button
          onClick={() =>
            setCurrentIndex((prev) =>
              prev === 0 ? images.length - 1 : prev - 1,
            )
          }
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() =>
            setCurrentIndex((prev) =>
              prev === images.length - 1 ? 0 : prev + 1,
            )
          }
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${currentIndex === i ? "bg-white scale-110 shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Modal forms fields changer helpers
  const handleMovieFormChange = (e) =>
    setMovieForm({ ...movieForm, [e.target.name]: e.target.value });
  const handleSeriesFormChange = (e) =>
    setSeriesForm({ ...seriesForm, [e.target.name]: e.target.value });
  const handleGameFormChange = (e) =>
    setGameForm({ ...gameForm, [e.target.name]: e.target.value });
  const handlePlaceFormChange = (e) =>
    setPlaceForm({ ...placeForm, [e.target.name]: e.target.value });
  const handleRestaurantFormChange = (e) =>
    setRestaurantForm({ ...restaurantForm, [e.target.name]: e.target.value });

  return (
    <div className="space-y-6">
      {/* Spider overlay for form submissions */}
      <SpiderOverlayLoader visible={formLoading} message={loaderMessage} />

      {/* 1. MODULE TOP INFO HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold capitalize text-slate-100 tracking-tight flex items-center gap-2">
            {activeModule === "webseries" ? "Web Series" : activeModule} Catalog
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {activeModule === "movies" &&
              "Open Movie reviews database. Browse community recommendations."}
            {activeModule === "webseries" &&
              "Explore streaming shows, track seasons and cast attribution."}
            {activeModule === "games" &&
              "Discover PC, mobile, and console gaming catalogs."}
            {activeModule === "places" &&
              "Pin and plan travel logs. Filter budget entry price points and locations."}
            {activeModule === "restaurants" &&
              "Dining tables, famous special dishes, and menu lists."}
          </p>
        </div>
        <button
          onClick={openUploadModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 font-bold text-xs shadow-md shadow-purple-500/10 hover:shadow-purple-500/30 transition transform active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Recommendations
        </button>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="glass p-5 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search Input (always visible) */}
        <div className="md:col-span-4 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-900 focus:border-purple-500/40 focus:outline-none text-xs transition text-slate-300"
          />
        </div>

        {/* Dynamic Filters depending on active module */}
        {(activeModule === "movies" || activeModule === "webseries") && (
          <>
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Genre (e.g. Sci-Fi)"
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none text-xs text-slate-300"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Language"
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none text-xs text-slate-300"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="OTT Platform"
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none text-xs text-slate-300"
              />
            </div>
          </>
        )}

        {activeModule === "games" && (
          <>
            <div className="md:col-span-3">
              <input
                type="text"
                placeholder="Genre"
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none text-xs text-slate-300"
              />
            </div>
            <div className="md:col-span-3">
              <input
                type="text"
                placeholder="Platform (Console/PC)"
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none text-xs text-slate-300"
              />
            </div>
          </>
        )}

        {activeModule === "places" && (
          <>
            <div className="md:col-span-3 flex items-center gap-2">
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                Max Price ($)
              </span>
              <input
                type="number"
                placeholder="e.g. 50"
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none text-xs text-slate-300"
              />
            </div>
            <div className="md:col-span-3 flex items-center gap-2">
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                Max Dist (km)
              </span>
              <input
                type="number"
                placeholder="e.g. 200"
                value={filterMaxDistance}
                onChange={(e) => setFilterMaxDistance(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none text-xs text-slate-300"
              />
            </div>
          </>
        )}

        {activeModule === "restaurants" && (
          <div className="md:col-span-4">
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:outline-none text-xs text-slate-300"
            >
              <option value="">All Prices</option>
              <option value="$">$ (Inexpensive)</option>
              <option value="$$">$$ (Moderate)</option>
              <option value="$$$">$$$ (Expensive)</option>
              <option value="$$$$">$$$$ (Fine Dining)</option>
            </select>
          </div>
        )}

        {/* Action button */}
        <div className="md:col-span-2 flex gap-2">
          <button
            onClick={loadListings}
            className="flex-grow py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold shadow active:scale-95 transition"
          >
            Apply
          </button>
          <button
            onClick={resetFilters}
            className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-900 text-slate-500 hover:text-slate-300 text-xs"
            title="Reset Filters"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. CARDS GRID */}
      {loading ? (
        <CardSkeletonLoader count={4} />
      ) : items.length === 0 ? (
        <div className="glass p-16 rounded-3xl flex flex-col items-center justify-center text-center text-slate-500">
          <SlidersHorizontal className="h-12 w-12 text-slate-800 mb-4" />
          <h3 className="text-base font-bold text-slate-400 mb-1">
            No Listings Found
          </h3>
          <p className="text-xs max-w-xs leading-relaxed">
            We couldn't find any entries matching your filters. Try search
            keywords or upload a recommendation!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const imgFiles = getItemImgProperty(item);
            const isLiked = (item.likedByUserIds || []).includes(user?.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setIsDetailOpen(true);
                }}
                className="glass rounded-3xl overflow-hidden cursor-pointer shadow-lg group hover:bg-slate-900/40 hover:-translate-y-1.5 hover:border-purple-500/20 transition-all duration-300 flex flex-col"
              >
                {/* Poster Image */}
                <div className="h-48 bg-slate-950 border-b border-slate-900 relative overflow-hidden flex-shrink-0">
                  {imgFiles.length > 0 ? (
                    <img
                      src={resolveImageUrl(imgFiles[0])}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950">
                      <Sparkles className="h-10 w-10 text-slate-800 mb-2" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        No Poster
                      </span>
                    </div>
                  )}

                  {/* Badges */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-bold rounded-full bg-slate-950/70 backdrop-blur text-purple-300 border border-purple-500/20 capitalize">
                    {activeModule === "webseries"
                      ? "Web Series"
                      : activeModule.slice(0, -1)}
                  </span>

                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={(e) => handleDeleteItemClick(item.id, e)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/70 backdrop-blur hover:bg-red-500/25 text-slate-400 hover:text-red-400 border border-white/5 transition"
                      title="Delete Listing"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm text-slate-200 line-clamp-1 group-hover:text-purple-300 transition-colors">
                      {item.name}
                    </h3>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-1">
                      {item.genre && (
                        <span className="px-2 py-0.5 text-[9px] font-semibold bg-slate-900 border border-slate-800 text-slate-400 rounded-lg">
                          {item.genre}
                        </span>
                      )}
                      {item.language && (
                        <span className="px-2 py-0.5 text-[9px] font-semibold bg-slate-900 border border-slate-800 text-slate-400 rounded-lg">
                          {item.language}
                        </span>
                      )}
                      {item.ottPlatform && (
                        <span className="px-2 py-0.5 text-[9px] font-semibold bg-purple-500/10 border border-purple-500/10 text-purple-300 rounded-lg font-bold">
                          {item.ottPlatform}
                        </span>
                      )}
                      {item.platform && (
                        <span className="px-2 py-0.5 text-[9px] font-semibold bg-blue-500/10 border border-blue-500/10 text-blue-300 rounded-lg">
                          {item.platform}
                        </span>
                      )}
                      {item.location && (
                        <span className="px-2 py-0.5 text-[9px] font-semibold bg-yellow-500/10 border border-yellow-500/10 text-yellow-300 rounded-lg max-w-[120px] truncate">
                          {item.location}
                        </span>
                      )}
                      {item.entryPrice !== undefined && (
                        <span className="px-2 py-0.5 text-[9px] font-semibold bg-green-500/10 border border-green-500/10 text-green-300 rounded-lg">
                          ${item.entryPrice}
                        </span>
                      )}
                      {item.distanceKm !== undefined && (
                        <span className="px-2 py-0.5 text-[9px] font-semibold bg-pink-500/10 border border-pink-500/10 text-pink-300 rounded-lg">
                          {item.distanceKm} km
                        </span>
                      )}
                      {item.priceRange && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/10 text-emerald-300 rounded-lg">
                          {item.priceRange}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Attribution */}
                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-3 mt-4 text-[10px] text-slate-500">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.uploadedBy?.id)
                          navigate(`/profile/${item.uploadedBy.id}`);
                      }}
                      className="hover:text-purple-400 transition"
                    >
                      By{" "}
                      <span className="font-bold text-slate-400">
                        {item.uploadedBy?.firstName || "User"}
                      </span>
                    </div>

                    <div className="flex gap-3 text-slate-400">
                      <button
                        onClick={(e) => handleLikeItem(item.id, e)}
                        className={`flex items-center gap-1 hover:text-rose-400 transition ${
                          isLiked ? "text-rose-500" : ""
                        }`}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${isLiked ? "fill-rose-500" : ""}`}
                        />
                        <span>{(item.likedByUserIds || []).length}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
                        <span>{(item.comments || []).length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==========================================
         4. UPLOAD MODAL FORM WITH CATEGORY GUARD
         ========================================== */}
      {isUploadOpen && (
        <Modal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          size="full"
          className="max-w-[1200px]"
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Upload Recommended{" "}
              {activeModule === "webseries"
                ? "Web Series"
                : activeModule.slice(0, -1)}
            </span>
          }
        >
          {/* Error / Success */}
          {/* {formError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <ShieldAlert className="h-4.5 w-4.5 text-red-400 flex-shrink-0 mt-0.5 animate-bounce" />
              <span>{formError}</span>
            </div>
          )} */}
          {formSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs">
              {formSuccess}
            </div>
          )}

          {lookupMode ? (
            <div className="space-y-6 max-w-[800px] mx-auto py-4">
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-lg font-bold text-slate-100 flex items-center justify-center gap-2">
                  <Search className="h-5 w-5 text-purple-400" />
                  Recommendation Smart Search
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Search to see if someone has already recommended this. If it
                  exists, you can comment directly. If it is a movie or series,
                  we can autofill it for you!
                </p>
              </div>

              {/* Search Input Bar */}
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={`Search for a ${formCategory.toLowerCase()}...`}
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLookupSearch();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-900 focus:border-purple-500/40 focus:outline-none text-xs text-slate-300 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLookupSearch}
                  disabled={lookupSearching}
                  className="px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-xs font-bold transition flex items-center gap-2 text-white"
                >
                  {lookupSearching ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Search Results */}
              {lookupSearchDone && (
                <div className="space-y-6">
                  {lookupInfoMessage && (
                    <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs">
                      {lookupInfoMessage}
                    </div>
                  )}
                  {/* LOCAL DATABASE MATCHES */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                      <Layers className="h-4 w-4" />
                      Already in Nexora Catalog ({lookupResults.db.length})
                    </h4>

                    {lookupResults.db.length === 0 ? (
                      <p className="text-xs text-slate-500 italic px-4 py-3 bg-slate-950/20 rounded-2xl border border-slate-900/50">
                        No existing matching recommendations found in Nexora
                        database.
                      </p>
                    ) : (
                      <div className="space-y-3.5">
                        {lookupResults.db.map((item) => (
                          <div
                            key={item.id}
                            className="glass p-4 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all flex flex-col md:flex-row justify-between gap-4"
                          >
                            <div className="flex gap-4">
                              <div className="h-16 w-16 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 border border-slate-900 flex items-center justify-center">
                                {getItemImgProperty(item)[0] ? (
                                  <img
                                    src={resolveImageUrl(
                                      getItemImgProperty(item)[0],
                                    )}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Sparkles className="h-5 w-5 text-slate-700" />
                                )}
                              </div>
                              <div className="py-0.5 space-y-1">
                                <h5 className="font-bold text-xs text-slate-200">
                                  {item.name}
                                </h5>
                                <div className="flex flex-wrap gap-1">
                                  {item.genre && (
                                    <span className="px-2 py-0.5 text-[9px] bg-slate-900 border border-slate-800 text-slate-400 rounded-lg">
                                      {item.genre}
                                    </span>
                                  )}
                                  {item.language && (
                                    <span className="px-2 py-0.5 text-[9px] bg-slate-900 border border-slate-800 text-slate-400 rounded-lg">
                                      {item.language}
                                    </span>
                                  )}
                                  {item.ottPlatform && (
                                    <span className="px-2 py-0.5 text-[9px] bg-purple-500/10 text-purple-300 rounded-lg font-bold">
                                      {item.ottPlatform}
                                    </span>
                                  )}
                                  {item.platform && (
                                    <span className="px-2 py-0.5 text-[9px] bg-blue-500/10 text-blue-300 rounded-lg">
                                      {item.platform}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  Uploaded by{" "}
                                  {item.uploadedBy?.firstName || "Member"}
                                </p>
                              </div>
                            </div>

                            {/* Inline Comment/Review Form */}
                            <div className="flex-grow max-w-sm flex flex-col justify-end gap-2 md:border-l md:border-white/5 md:pl-4">
                              <textarea
                                placeholder="This recommendation exists! Add your comments/review here..."
                                value={dbCommentTexts[item.id] || ""}
                                onChange={(e) =>
                                  setDbCommentTexts({
                                    ...dbCommentTexts,
                                    [item.id]: e.target.value,
                                  })
                                }
                                className="w-full min-h-[48px] p-2 text-xs text-slate-200 bg-slate-950 border border-slate-900 rounded-xl focus:outline-none focus:border-purple-500/40 resize-none no-scrollbar"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleDbInlineComment(
                                    item.id,
                                    dbCommentTexts[item.id],
                                  )
                                }
                                className="py-1.5 px-3 self-end rounded-xl bg-purple-600 hover:bg-purple-500 text-[10px] font-bold transition flex items-center gap-1 text-white shadow"
                              >
                                <Send className="h-3 w-3" />
                                Post Comment
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PUBLIC API MATCHES (Only for Movies/WebSeries) */}
                  {(activeModule === "movies" ||
                    activeModule === "webseries") && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                        <Sparkles className="h-4 w-4" />
                        Import from Public Directory ({lookupResults.api.length}
                        )
                      </h4>

                      {lookupResults.api.length === 0 ? (
                        <p className="text-xs text-slate-500 italic px-4 py-3 bg-slate-950/20 rounded-2xl border border-slate-900/50">
                          No matching items found in TVMaze public database.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {lookupResults.api.slice(0, 6).map((show) => (
                            <div
                              key={show.id}
                              className="glass p-3.5 rounded-2xl border border-white/5 hover:border-pink-500/20 transition-all flex gap-3 items-center justify-between"
                            >
                              <div className="flex gap-3 min-w-0">
                                <div className="h-14 w-10 bg-slate-950 rounded-lg overflow-hidden flex-shrink-0 border border-slate-900 flex items-center justify-center">
                                  {show.image?.medium ||
                                  show.image?.original ? (
                                    <img
                                      src={
                                        show.image.medium || show.image.original
                                      }
                                      alt={show.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Sparkles className="h-4 w-4 text-slate-700" />
                                  )}
                                </div>
                                <div className="py-0.5 min-w-0 space-y-1">
                                  <h5
                                    className="font-bold text-xs text-slate-200 truncate"
                                    title={show.name}
                                  >
                                    {show.name}
                                  </h5>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {show.premiered
                                      ? `${show.premiered.split("-")[0]}`
                                      : "N/A"}
                                    {show.language ? ` • ${show.language}` : ""}
                                  </p>
                                  <p className="text-[9px] text-slate-500 truncate">
                                    {show.genres?.join(", ") || "No genres"}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleImportSelect(show)}
                                className="px-3 py-1.5 rounded-xl border border-pink-500/30 hover:bg-pink-500/10 text-[10px] font-bold text-pink-300 transition whitespace-nowrap"
                              >
                                Import
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Manual entry fallback */}
              <div className="border-t border-slate-900/60 pt-6 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">
                  Not finding what you need? Add details manually directly.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    // Reset manual forms
                    if (activeModule === "movies") {
                      setMovieForm({
                        name: lookupQuery || "",
                        genre: "",
                        language: "",
                        ottPlatform: "",
                        director: "",
                        hero: "",
                        heroine: "",
                        releaseDate: "",
                        rating: "",
                      });
                    } else if (activeModule === "webseries") {
                      setSeriesForm({
                        name: lookupQuery || "",
                        genre: "",
                        language: "",
                        ottPlatform: "",
                        director: "",
                        leadCast: "",
                        seasons: "",
                        releaseDate: "",
                        rating: "",
                      });
                    } else if (activeModule === "games") {
                      setGameForm({
                        name: lookupQuery || "",
                        genre: "",
                        platform: "",
                      });
                    } else if (activeModule === "places") {
                      setPlaceForm({
                        name: lookupQuery || "",
                        location: "",
                        entryPrice: "",
                        distanceKm: "",
                        details: "",
                      });
                    } else if (activeModule === "restaurants") {
                      setRestaurantForm({
                        name: lookupQuery || "",
                        location: "",
                        specialItems: "",
                        priceRange: "$$",
                      });
                    }
                    setLookupMode(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold transition text-slate-300"
                >
                  Enter Details Manually
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleUploadSubmit}
              className="grid gap-5 w-full max-w-[1360px] mx-auto"
            >
              {/* Category Guard selector (Locked / Read-Only) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Category Type
                </label>
                <div className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-900 text-xs font-bold text-purple-300">
                  {formCategory}
                </div>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  This category is locked to match the current catalog section.
                </span>
              </div>

              {/* DYNAMIC FORM SEGMENTS */}

              {/* MOVIES FIELDS */}
              {activeModule === "movies" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="col-span-full space-y-1">
                    <label className="text-xs text-slate-400">Movie Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Inception"
                      value={movieForm.name}
                      onChange={handleMovieFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Genre</label>
                    <input
                      type="text"
                      name="genre"
                      required
                      placeholder="Sci-Fi"
                      value={movieForm.genre}
                      onChange={handleMovieFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Language</label>
                    <input
                      type="text"
                      name="language"
                      required
                      placeholder="English"
                      value={movieForm.language}
                      onChange={handleMovieFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      OTT Platform
                    </label>
                    <input
                      type="text"
                      name="ottPlatform"
                      required
                      placeholder="Netflix"
                      value={movieForm.ottPlatform}
                      onChange={handleMovieFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Director</label>
                    <input
                      type="text"
                      name="director"
                      required
                      placeholder="Christopher Nolan"
                      value={movieForm.director}
                      onChange={handleMovieFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="lg:col-span-1 space-y-1">
                    <label className="text-xs text-slate-400">
                      Hero (Optional)
                    </label>
                    <input
                      type="text"
                      name="hero"
                      placeholder="Leonardo DiCaprio"
                      value={movieForm.hero}
                      onChange={handleMovieFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="lg:col-span-1 space-y-1">
                    <label className="text-xs text-slate-400">
                      Heroine (Optional)
                    </label>
                    <input
                      type="text"
                      name="heroine"
                      placeholder="Marion Cotillard"
                      value={movieForm.heroine}
                      onChange={handleMovieFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="lg:col-span-1 space-y-1">
                    <label className="text-xs text-slate-400">
                      Release Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="releaseDate"
                      value={movieForm.releaseDate}
                      onChange={handleMovieFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* WEB SERIES FIELDS */}
              {activeModule === "webseries" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="col-span-full space-y-1">
                    <label className="text-xs text-slate-400">
                      Series Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Stranger Things"
                      value={seriesForm.name}
                      onChange={handleSeriesFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Genre</label>
                    <input
                      type="text"
                      name="genre"
                      required
                      placeholder="Sci-Fi"
                      value={seriesForm.genre}
                      onChange={handleSeriesFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Language</label>
                    <input
                      type="text"
                      name="language"
                      required
                      placeholder="English"
                      value={seriesForm.language}
                      onChange={handleSeriesFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      OTT Platform
                    </label>
                    <input
                      type="text"
                      name="ottPlatform"
                      required
                      placeholder="Netflix"
                      value={seriesForm.ottPlatform}
                      onChange={handleSeriesFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Director</label>
                    <input
                      type="text"
                      name="director"
                      required
                      placeholder="Duffer Brothers"
                      value={seriesForm.director}
                      onChange={handleSeriesFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-1">
                    <label className="text-xs text-slate-400">Lead Cast</label>
                    <input
                      type="text"
                      name="leadCast"
                      required
                      placeholder="Millie Bobby Brown, Winona Ryder"
                      value={seriesForm.leadCast}
                      onChange={handleSeriesFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="lg:col-span-1 space-y-1">
                    <label className="text-xs text-slate-400">Seasons</label>
                    <input
                      type="number"
                      name="seasons"
                      required
                      placeholder="4"
                      value={seriesForm.seasons}
                      onChange={handleSeriesFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="lg:col-span-1 space-y-1">
                    <label className="text-xs text-slate-400">
                      First-Release Date
                    </label>
                    <input
                      type="date"
                      name="releaseDate"
                      required
                      value={seriesForm.releaseDate}
                      onChange={handleSeriesFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* GAMES FIELDS */}
              {activeModule === "games" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-full space-y-1">
                    <label className="text-xs text-slate-400">Game Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Elden Ring"
                      value={gameForm.name}
                      onChange={handleGameFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Genre</label>
                    <input
                      type="text"
                      name="genre"
                      required
                      placeholder="RPG / Action"
                      value={gameForm.genre}
                      onChange={handleGameFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Platform</label>
                    <input
                      type="text"
                      name="platform"
                      required
                      placeholder="Cross-platform"
                      value={gameForm.platform}
                      onChange={handleGameFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                </div>
              )}

              {/* PLACES FIELDS */}
              {activeModule === "places" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2 space-y-1">
                    <label className="text-xs text-slate-400">Place Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Taj Mahal"
                      value={placeForm.name}
                      onChange={handlePlaceFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Location</label>
                    <input
                      type="text"
                      name="location"
                      required
                      placeholder="Agra, India"
                      value={placeForm.location}
                      onChange={handlePlaceFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      Visiting Price ($)
                    </label>
                    <input
                      type="number"
                      name="entryPrice"
                      required
                      placeholder="e.g. 15"
                      value={placeForm.entryPrice}
                      onChange={handlePlaceFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      name="distanceKm"
                      required
                      placeholder="e.g. 120"
                      value={placeForm.distanceKm}
                      onChange={handlePlaceFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="lg:col-span-4 space-y-1">
                    <label className="text-xs text-slate-400">
                      Details & Safety Guidelines
                    </label>
                    <textarea
                      name="details"
                      rows="3"
                      placeholder="Best visited at sunrise. Carry drinking water."
                      value={placeForm.details}
                      onChange={handlePlaceFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* RESTAURANTS FIELDS */}
              {activeModule === "restaurants" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2 space-y-1">
                    <label className="text-xs text-slate-400">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Pizzeria Roma"
                      value={restaurantForm.name}
                      onChange={handleRestaurantFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Location</label>
                    <input
                      type="text"
                      name="location"
                      required
                      placeholder="Downtown St, Sector 4"
                      value={restaurantForm.location}
                      onChange={handleRestaurantFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="lg:col-span-3 space-y-1">
                    <label className="text-xs text-slate-400">
                      Notable Dishes / Specialties
                    </label>
                    <input
                      type="text"
                      name="specialItems"
                      required
                      placeholder="Woodfired Pepperoni, Tiramisu"
                      value={restaurantForm.specialItems}
                      onChange={handleRestaurantFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      Price Range
                    </label>
                    <select
                      name="priceRange"
                      value={restaurantForm.priceRange}
                      onChange={handleRestaurantFormChange}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs focus:outline-none text-slate-300"
                    >
                      <option value="$">$ (Cheap Eats)</option>
                      <option value="$$">$$ (Moderate)</option>
                      <option value="$$$">$$$ (Expensive)</option>
                      <option value="$$$$">$$$$ (Fine Dining)</option>
                    </select>
                  </div>
                </div>
              )}
              {/* Shared Image Upload input */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Media Attachment{" "}
                  {["places", "restaurants"].includes(activeModule) &&
                    "(Multiple Allowed)"}
                </label>

                {/* ── Imported poster preview (TVMaze import) ─────────────────── */}
                {externalImageUrl && (
                  <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                    {/* Poster thumbnail */}
                    <div className="relative flex-shrink-0 w-20 h-28 rounded-xl overflow-hidden border border-purple-500/40 shadow-lg shadow-purple-900/30">
                      <img
                        src={externalImageUrl}
                        alt="Imported poster"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.classList.add("bg-slate-900");
                        }}
                      />
                    </div>
                    {/* Info + actions */}
                    <div className="flex-1 space-y-1.5">
                      <p className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        Poster Auto-Imported
                      </p>
                      <p className="text-[11px] text-slate-400 leading-snug break-all">
                        {externalImageUrl}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        This poster was automatically fetched from the public
                        API. You can keep it or upload your own below.
                      </p>
                      <button
                        type="button"
                        onClick={() => setExternalImageUrl("")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-[11px] font-semibold transition"
                      >
                        <X className="h-3 w-3" />
                        Remove Imported Poster
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual file upload — always visible, overrides external URL if selected */}
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    {externalImageUrl
                      ? "Optional: Upload your own to override the imported poster"
                      : "Select an image to attach"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple={["places", "restaurants"].includes(activeModule)}
                    onChange={(e) => setFormFiles(Array.from(e.target.files))}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-slate-300 hover:file:bg-slate-800"
                  />

                  {/* Thumbnails preview for manually selected files */}
                  {formFiles.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                      {formFiles.map((file, i) => (
                        <div
                          key={i}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormFiles((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-red-500/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Warning notice about personal photos */}
                <div className="mt-1 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed flex gap-2.5 items-start">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">
                      Privacy &amp; Content Policy
                    </span>
                    Please upload only official posters, cover art, or
                    representative public photos.{" "}
                    <strong className="text-amber-100 font-bold underline">
                      Do not upload personal photos
                    </strong>{" "}
                    or sensitive images to this directory.
                  </div>
                </div>
              </div>

              {/* Submit Trigger */}
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setLookupMode(true)}
                  className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 font-semibold transition text-xs text-slate-400 hover:text-slate-200"
                >
                  Back to Search
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-grow py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition transform active:scale-95 disabled:opacity-40 text-xs text-white"
                >
                  {formLoading ? (
                    <ButtonLoader text="Uploading" />
                  ) : (
                    "Upload Recommendation"
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ==========================================
         5. DETAIL VIEW MODAL WITH COMMENTS — REDESIGNED
         ========================================== */}
      {isDetailOpen && selectedItem && (
        <Modal
          isOpen={isDetailOpen && !!selectedItem}
          onClose={() => {
            setSelectedItem(null);
            setIsDetailOpen(false);
          }}
          size="4xl"
          closeButtonPosition="absolute"
          className="!p-0 overflow-hidden"
        >
          {/* ── Cinematic Two-Panel Layout ── */}
          <div className="flex flex-col md:flex-row h-[85vh] md:h-auto md:min-h-[560px] md:max-h-[88vh] w-full">
            {/* LEFT PANEL — Poster */}
            <div className="relative md:w-[300px] flex-shrink-0 bg-slate-950 overflow-hidden h-[35vh] md:h-auto">
              {getItemImgProperty(selectedItem).length > 0 ? (
                <>
                  <img
                    src={resolveImageUrl(getItemImgProperty(selectedItem)[0])}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600";
                    }}
                  />
                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/30 md:to-slate-900/80" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950">
                  <Sparkles className="h-12 w-12 md:h-16 md:w-16 text-slate-800 mb-3" />
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-600">
                    No Poster
                  </span>
                </div>
              )}

              {/* Bottom overlay: title + uploader */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                {/* Content type badge */}
                <span className="inline-block mb-2 px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 uppercase tracking-wider backdrop-blur-sm">
                  {activeModule === "webseries"
                    ? "Web Series"
                    : activeModule.slice(0, -1)}
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight drop-shadow-lg line-clamp-2">
                  {selectedItem.name}
                </h2>
                <div
                  onClick={() => {
                    if (selectedItem.uploadedBy?.id) {
                      setIsDetailOpen(false);
                      navigate(`/profile/${selectedItem.uploadedBy.id}`);
                    }
                  }}
                  className="text-[11px] text-purple-300 hover:text-purple-200 hover:underline cursor-pointer mt-1 transition truncate"
                >
                  Recommended by {selectedItem.uploadedBy?.firstName || "User"}{" "}
                  {selectedItem.uploadedBy?.lastName || ""}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL — Details + Comments */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-900">
              {/* Scrollable details area */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-5 md:p-6 space-y-5">
                {/* ── Hero Stats Row (Rating + Release + Platform) ── */}
                {(selectedItem.rating ||
                  selectedItem.releaseDate ||
                  selectedItem.ottPlatform) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Rating */}
                    {selectedItem.rating !== undefined &&
                      selectedItem.rating !== null && (
                        <div className="flex flex-col gap-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
                          <span className="text-[9px] uppercase tracking-widest text-amber-400/70 font-bold">
                            Rating
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-2xl font-extrabold text-amber-400 leading-none">
                              {Number(selectedItem.rating).toFixed(1)}
                            </span>
                            <span className="text-amber-400/60 text-xs font-medium">
                              /10
                            </span>
                          </div>
                          {/* Star row */}
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <svg
                                key={s}
                                viewBox="0 0 20 20"
                                fill={
                                  selectedItem.rating / 2 >= s
                                    ? "#f59e0b"
                                    : selectedItem.rating / 2 >= s - 0.5
                                      ? "url(#half)"
                                      : "none"
                                }
                                stroke="#f59e0b"
                                strokeWidth="1"
                                className="w-3.5 h-3.5"
                              >
                                <defs>
                                  <linearGradient
                                    id="half"
                                    x1="0"
                                    x2="1"
                                    y1="0"
                                    y2="0"
                                  >
                                    <stop offset="50%" stopColor="#f59e0b" />
                                    <stop
                                      offset="50%"
                                      stopColor="transparent"
                                    />
                                  </linearGradient>
                                </defs>
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Release Date */}
                    {selectedItem.releaseDate && (
                      <div className="flex flex-col gap-1 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
                        <span className="text-[9px] uppercase tracking-widest text-blue-400/70 font-bold">
                          Release Date
                        </span>
                        <span className="text-lg font-extrabold text-blue-300 leading-none">
                          {formatDisplayDate(selectedItem.releaseDate)}
                        </span>
                        <span className="text-[10px] text-blue-400/50 mt-0.5">
                          {selectedItem.releaseDate?.slice(0, 4) || ""}
                        </span>
                      </div>
                    )}

                    {/* OTT Platform */}
                    {selectedItem.ottPlatform && (
                      <div className="flex flex-col gap-1 bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3">
                        <span className="text-[9px] uppercase tracking-widest text-purple-400/70 font-bold">
                          Platform
                        </span>
                        <span
                          className="text-lg font-extrabold text-purple-300 leading-none truncate"
                          title={selectedItem.ottPlatform}
                        >
                          {selectedItem.ottPlatform}
                        </span>
                        <span className="text-[10px] text-purple-400/50 mt-0.5">
                          OTT / Streaming
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Expanded Metadata Cards ── */}
                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                        {activeModule === "webseries" ? "Series Details" : "Movie Details"}
                      </p>
                      <h3 className="text-sm font-semibold text-slate-100 mt-1">
                        Crew, cast, and streaming info
                      </h3>
                    </div>
                    <div className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                      {activeModule === "webseries" ? "Web Series" : "Movie"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {selectedItem.director && (
                      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                          Director
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          {selectedItem.director}
                        </p>
                      </div>
                    )}
                    {selectedItem.hero && (
                      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                          {activeModule === "webseries" ? "Lead Cast" : "Lead Hero"}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          {selectedItem.hero}
                        </p>
                      </div>
                    )}
                    {selectedItem.heroine && (
                      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                          Lead Heroine
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          {selectedItem.heroine}
                        </p>
                      </div>
                    )}
                    {selectedItem.leadCast && (
                      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                          Lead Cast
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          {selectedItem.leadCast}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Specifications Grid ── */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-slate-800/80">
                    Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                    {selectedItem.genre && (
                      <div className="col-span-2 flex justify-between items-start">
                        <span className="text-slate-500 flex-shrink-0">
                          Genre
                        </span>
                        <span className="text-slate-200 font-semibold text-right">
                          {selectedItem.genre}
                        </span>
                      </div>
                    )}
                    {selectedItem.language && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Language</span>
                        <span className="text-slate-200 font-semibold">
                          {selectedItem.language}
                        </span>
                      </div>
                    )}
                    {selectedItem.director && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Director</span>
                        <span
                          className="text-slate-200 font-semibold text-right max-w-[130px] truncate"
                          title={selectedItem.director}
                        >
                          {selectedItem.director}
                        </span>
                      </div>
                    )}
                    {/* Movies — Hero & Heroine */}
                    {selectedItem.hero && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Lead Hero</span>
                        <span
                          className="text-slate-200 font-semibold text-right max-w-[130px] truncate"
                          title={selectedItem.hero}
                        >
                          {selectedItem.hero}
                        </span>
                      </div>
                    )}
                    {selectedItem.heroine && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Lead Heroine</span>
                        <span
                          className="text-slate-200 font-semibold text-right max-w-[130px] truncate"
                          title={selectedItem.heroine}
                        >
                          {selectedItem.heroine}
                        </span>
                      </div>
                    )}
                    {/* Web Series — Lead Cast & Seasons */}
                    {selectedItem.leadCast && (
                      <div className="col-span-2 flex justify-between items-start gap-3">
                        <span className="text-slate-500 flex-shrink-0">
                          Lead Cast
                        </span>
                        <span className="text-slate-200 font-semibold text-right leading-snug">
                          {selectedItem.leadCast}
                        </span>
                      </div>
                    )}
                    {selectedItem.seasons !== undefined &&
                      selectedItem.seasons !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Seasons</span>
                          <span className="text-slate-200 font-semibold">
                            {selectedItem.seasons}
                          </span>
                        </div>
                      )}
                    {/* Games */}
                    {selectedItem.platform && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Platform</span>
                        <span className="text-blue-300 font-semibold">
                          {selectedItem.platform}
                        </span>
                      </div>
                    )}
                    {/* Places & Restaurants */}
                    {selectedItem.location && (
                      <div className="col-span-2 flex justify-between items-center">
                        <span className="text-slate-500">Location</span>
                        <span className="text-slate-200 font-semibold">
                          {selectedItem.location}
                        </span>
                      </div>
                    )}
                    {selectedItem.entryPrice !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Entry Price</span>
                        <span className="text-green-300 font-bold">
                          ${selectedItem.entryPrice}
                        </span>
                      </div>
                    )}
                    {selectedItem.distanceKm !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Distance</span>
                        <span className="text-slate-200 font-semibold">
                          {selectedItem.distanceKm} km
                        </span>
                      </div>
                    )}
                    {selectedItem.priceRange && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Price Range</span>
                        <span className="text-emerald-300 font-bold">
                          {selectedItem.priceRange}
                        </span>
                      </div>
                    )}
                    {selectedItem.specialItems && (
                      <div className="col-span-2 flex justify-between items-start gap-3">
                        <span className="text-slate-500 flex-shrink-0">
                          Specialties
                        </span>
                        <span className="text-slate-200 font-semibold text-right leading-snug">
                          {selectedItem.specialItems}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedItem.details && (
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">
                        Details & Tips
                      </span>
                      <p className="text-xs text-slate-400 font-light leading-relaxed whitespace-pre-wrap">
                        {selectedItem.details}
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Community Reviews ── */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-slate-800/80">
                    Community Reviews ({(selectedItem.comments || []).length})
                  </h3>
                  <div className="space-y-3 max-h-44 overflow-y-auto no-scrollbar pr-1">
                    {(selectedItem.comments || []).length === 0 ? (
                      <p className="text-xs text-slate-600 italic py-2">
                        No reviews yet. Be the first to comment!
                      </p>
                    ) : (
                      (selectedItem.comments || []).map((comment, index) => (
                        <div key={index} className="flex gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5">
                            {(comment.userName || "U")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                onClick={() => {
                                  setIsDetailOpen(false);
                                  navigate(`/profile/${comment.userId}`);
                                }}
                                className="text-xs font-bold text-slate-300 hover:text-purple-400 cursor-pointer truncate"
                              >
                                {comment.userName}
                              </span>
                              <span className="text-[9px] text-slate-600 flex-shrink-0">
                                {new Date(comment.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-light mt-0.5 leading-relaxed">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* ── Sticky Footer: Like + Comment Input ── */}
              <div className="border-t border-slate-800/60 px-6 py-4 space-y-3 bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {(selectedItem.likedByUserIds || []).length} people liked
                    this
                  </span>
                  <button
                    onClick={() => handleLikeItem(selectedItem.id)}
                    className={`flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full border transition-all duration-200 active:scale-95 ${
                      (selectedItem.likedByUserIds || []).includes(user?.id)
                        ? "text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20"
                        : "text-slate-300 border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 transition-all ${(selectedItem.likedByUserIds || []).includes(user?.id) ? "fill-rose-400" : ""}`}
                    />
                    {(selectedItem.likedByUserIds || []).includes(user?.id)
                      ? "Liked"
                      : "Like"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={commentListingMutation.isPending}
                    placeholder={
                      commentListingMutation.isPending
                        ? "Submitting review..."
                        : "Write a review..."
                    }
                    value={detailComment}
                    onChange={(e) => setDetailComment(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      !commentListingMutation.isPending &&
                      handleCommentItem()
                    }
                    className="flex-grow px-4 py-2.5 rounded-full bg-slate-950/60 border border-slate-800 text-xs focus:outline-none focus:border-purple-500/40 transition text-slate-300 placeholder:text-slate-600 disabled:opacity-50"
                  />
                  <button
                    onClick={handleCommentItem}
                    disabled={
                      commentListingMutation.isPending || !detailComment.trim()
                    }
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:opacity-90 transition disabled:opacity-40 shadow-lg shadow-purple-500/20"
                  >
                    {commentListingMutation.isPending ? (
                      <InlineLoader size={14} />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Recommendation?"
        description="Are you sure you want to remove this recommendation from the catalog?"
        alertTitle="Critical Action Alert"
        alertMessage="Deleting this entry removes its ratings, metadata details, and associated reviews from the open community directories. This action is irreversible."
        onCancel={() => setDeleteConfirm({ isOpen: false, itemId: null })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default DiscoveryModules;
