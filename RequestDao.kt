package com.rabatlights.ledcalculator.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface RequestDao {
    @Query("SELECT * FROM client_requests ORDER BY id DESC")
    fun getAllRequests(): Flow<List<ClientRequest>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRequest(request: ClientRequest): Long

    @Query("DELETE FROM client_requests WHERE id = :requestId")
    suspend fun deleteRequestById(requestId: Long)

    @Delete
    suspend fun deleteRequest(request: ClientRequest)
}
