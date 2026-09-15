"""
Production ML Pipeline Ensembles for Level 1 and Level 2.
Defined in a canonical importable module to prevent pickle/joblib __main__ namespace serialization issues.
"""

from typing import List
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier

from dataset_schema import (
    LEVEL_1_FEATURES,
    LEVEL_2_FEATURES,
    LEVEL_1_CLASSES,
    LEVEL_2_CLASSES,
)
from preprocessing import Level1Preprocessor, Level2Preprocessor


class Level1ProductionPipeline:
    """
    Encapsulates Level 1 feature preprocessing, encoding, and calibrated Logistic Regression.
    Accepts raw DataFrame inputs and outputs calibrated recovery probabilities.
    """

    def __init__(self, preprocessor: Level1Preprocessor, calibrated_model: CalibratedClassifierCV):
        self.preprocessor = preprocessor
        self.calibrated_model = calibrated_model
        self.classes_ = LEVEL_1_CLASSES
        self.feature_names_in_ = LEVEL_1_FEATURES

    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """Return calibrated class probabilities: [P(SALVAGEABLE), P(END_OF_LIFE)]."""
        X = self.preprocessor.transform(df[self.feature_names_in_])
        return self.calibrated_model.predict_proba(X)

    def predict(self, df: pd.DataFrame, threshold: float = 0.50) -> List[str]:
        """Return predicted class string using specified decision threshold for EOL."""
        probas = self.predict_proba(df)
        p_eol = probas[:, 1]
        indices = (p_eol >= threshold).astype(int)
        return self.preprocessor.decode_target(indices)


class Level2ProductionPipeline:
    """
    Encapsulates Level 2 feature preprocessing, encoding, and multi-class Random Forest.
    Accepts raw DataFrame inputs and outputs circular pathway disposition probabilities.
    """

    def __init__(self, preprocessor: Level2Preprocessor, model: RandomForestClassifier):
        self.preprocessor = preprocessor
        self.model = model
        self.classes_ = LEVEL_2_CLASSES
        self.feature_names_in_ = LEVEL_2_FEATURES

    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """Return class probability distribution over LEVEL_2_CLASSES."""
        X = self.preprocessor.transform(df[self.feature_names_in_])
        return self.model.predict_proba(X)

    def predict(self, df: pd.DataFrame) -> List[str]:
        """Return argmax predicted circular action."""
        X = self.preprocessor.transform(df[self.feature_names_in_])
        preds = self.model.predict(X)
        return self.preprocessor.decode_target(preds)
