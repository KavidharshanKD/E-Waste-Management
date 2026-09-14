"""
ML Preprocessing Pipelines for Hierarchical E-Waste Recommendation
Implements scikit-learn transformers for Level 1 (Physical Feasibility) and
Level 2 (Circular Pathway) without training any ML model.
"""

from typing import List, Dict, Any, Optional, Union
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, RobustScaler

from dataset_schema import (
    LEVEL_1_FEATURES,
    LEVEL_2_FEATURES,
    LEVEL_1_CLASSES,
    LEVEL_2_CLASSES,
)


class Level1Preprocessor(BaseEstimator, TransformerMixin):
    """
    Reusable scikit-learn preprocessing pipeline for Level 1: Physical Feasibility.
    Features: ['category', 'approx_age_years', 'condition']
    Encodes nominal categories via OneHotEncoder (handle_unknown='ignore').
    Scales device age via RobustScaler (robust to lifespan skew).
    """

    def __init__(self):
        self.categorical_cols = ["category", "condition"]
        self.numerical_cols = ["approx_age_years"]
        self.feature_columns = LEVEL_1_FEATURES

        self.target_to_idx = {cls_name: i for i, cls_name in enumerate(LEVEL_1_CLASSES)}
        self.idx_to_target = {i: cls_name for i, cls_name in enumerate(LEVEL_1_CLASSES)}

        self.cat_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        self.num_transformer = RobustScaler()

        self.column_transformer = ColumnTransformer(
            transformers=[
                ("num", self.num_transformer, self.numerical_cols),
                ("cat", self.cat_transformer, self.categorical_cols),
            ],
            remainder="drop",
            verbose_feature_names_out=False,
        )
        self.is_fitted = False

    def fit(self, X: pd.DataFrame, y: Optional[Any] = None) -> "Level1Preprocessor":
        """Fit preprocessor onto feature DataFrame."""
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=self.feature_columns)
        self.column_transformer.fit(X[self.feature_columns])
        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Transform input features using fitted scalers and encoders."""
        if not self.is_fitted:
            raise RuntimeError("Level1Preprocessor must be fitted before transforming data.")
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=self.feature_columns)
        return self.column_transformer.transform(X[self.feature_columns])

    def fit_transform(self, X: pd.DataFrame, y: Optional[Any] = None) -> np.ndarray:
        """Fit and transform input features in one call."""
        return self.fit(X, y).transform(X)

    def get_feature_names_out(self) -> List[str]:
        """Return human-readable names of all encoded/scaled output features."""
        if not self.is_fitted:
            raise RuntimeError("Cannot get feature names from unfitted Level1Preprocessor.")
        return list(self.column_transformer.get_feature_names_out())

    def encode_target(self, y: Union[pd.Series, List[str], np.ndarray]) -> np.ndarray:
        """Map string target labels (SALVAGEABLE, END_OF_LIFE) to discrete integers."""
        if isinstance(y, (pd.Series, np.ndarray, list)):
            return np.array([self.target_to_idx[str(val)] for val in y], dtype=int)
        raise ValueError(f"Unsupported target container type: {type(y)}")

    def decode_target(self, y_encoded: Union[np.ndarray, List[int]]) -> List[str]:
        """Map integer target predictions back to string labels."""
        return [self.idx_to_target[int(val)] for val in y_encoded]


class Level2Preprocessor(BaseEstimator, TransformerMixin):
    """
    Reusable scikit-learn preprocessing pipeline for Level 2: Circular Pathway.
    Features: ['category', 'approx_age_years', 'condition', 'powers_on',
               'screen_condition', 'battery_condition', 'damage_severity']
    Excludes user_intention and safety hazard flags.
    Encodes nominal attributes via OneHotEncoder (handle_unknown='ignore').
    Scales device age via RobustScaler.
    """

    def __init__(self):
        self.categorical_cols = [
            "category",
            "condition",
            "powers_on",
            "screen_condition",
            "battery_condition",
            "damage_severity",
        ]
        self.numerical_cols = ["approx_age_years"]
        self.feature_columns = LEVEL_2_FEATURES

        self.target_to_idx = {cls_name: i for i, cls_name in enumerate(LEVEL_2_CLASSES)}
        self.idx_to_target = {i: cls_name for i, cls_name in enumerate(LEVEL_2_CLASSES)}

        self.cat_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        self.num_transformer = RobustScaler()

        self.column_transformer = ColumnTransformer(
            transformers=[
                ("num", self.num_transformer, self.numerical_cols),
                ("cat", self.cat_transformer, self.categorical_cols),
            ],
            remainder="drop",
            verbose_feature_names_out=False,
        )
        self.is_fitted = False

    def fit(self, X: pd.DataFrame, y: Optional[Any] = None) -> "Level2Preprocessor":
        """Fit preprocessor onto feature DataFrame."""
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=self.feature_columns)
        self.column_transformer.fit(X[self.feature_columns])
        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Transform input features using fitted scalers and encoders."""
        if not self.is_fitted:
            raise RuntimeError("Level2Preprocessor must be fitted before transforming data.")
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=self.feature_columns)
        return self.column_transformer.transform(X[self.feature_columns])

    def fit_transform(self, X: pd.DataFrame, y: Optional[Any] = None) -> np.ndarray:
        """Fit and transform input features in one call."""
        return self.fit(X, y).transform(X)

    def get_feature_names_out(self) -> List[str]:
        """Return human-readable names of all encoded/scaled output features."""
        if not self.is_fitted:
            raise RuntimeError("Cannot get feature names from unfitted Level2Preprocessor.")
        return list(self.column_transformer.get_feature_names_out())

    def encode_target(self, y: Union[pd.Series, List[str], np.ndarray]) -> np.ndarray:
        """Map circular target strings to discrete integers."""
        if isinstance(y, (pd.Series, np.ndarray, list)):
            return np.array([self.target_to_idx[str(val)] for val in y], dtype=int)
        raise ValueError(f"Unsupported target container type: {type(y)}")

    def decode_target(self, y_encoded: Union[np.ndarray, List[int]]) -> List[str]:
        """Map integer target predictions back to string labels."""
        return [self.idx_to_target[int(val)] for val in y_encoded]
