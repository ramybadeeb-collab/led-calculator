package com.rabatlights.ledcalculator.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "client_requests")
data class ClientRequest(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val clientName: String,
    val dateString: String,
    val reqWidth: Double,
    val reqHeight: Double,
    val dimensionUnit: String, // "m" or "cm"
    val isDoubleSided: Boolean,
    val moduleName: String,
    val actualWidthM: Double,
    val actualHeightM: Double,
    val totalModules: Int,
    val powerSuppliesCount: Int,
    val totalReceivingCards: Int,
    val totalCost: Double,
    val currency: String
)
