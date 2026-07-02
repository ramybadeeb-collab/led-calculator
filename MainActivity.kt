package com.rabatlights.ledcalculator

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.os.Bundle
import android.os.Environment
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.lifecycleScope
import com.rabatlights.ledcalculator.data.AppDatabase
import com.rabatlights.ledcalculator.data.ClientRequest
import com.rabatlights.ledcalculator.data.RequestDao
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

// Data structure for LED Modules
data class LedModule(
    val id: String,
    val name: String,
    val widthMm: Int,
    val heightMm: Int,
    val wattPower: Int,
    val priceUsd: Double
)

class MainActivity : ComponentActivity() {
    private lateinit var db: AppDatabase
    private lateinit var dao: RequestDao

    // Predefined LED Modules
    private val PREDEFINED_MODULES = listOf(
        LedModule("p10_out", "P10 خارجي (32×16 سم)", 320, 160, 25, 9.0),
        LedModule("p5_out", "P5 خارجي (32×16 سم)", 320, 160, 30, 13.5),
        LedModule("p4_out", "P4 خارجي (32×16 سم)", 320, 160, 30, 16.0),
        LedModule("p3_91_in", "PH3.91 داخلي (25×25 سم)", 250, 250, 20, 19.5),
        LedModule("p4_81_out", "PH4.81 خارجي (25×25 سم)", 250, 250, 25, 24.0),
        LedModule("p2_in", "P2 داخلي (32×16 سم)", 320, 160, 18, 22.0)
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize Room Database
        db = AppDatabase.getDatabase(this)
        dao = db.requestDao()

        setContent {
            var savedRequests by remember { mutableStateOf(listOf<ClientRequest>()) }

            // Observe Room Database for Offline Requests
            LaunchedEffect(Unit) {
                dao.getAllRequests().collect { list ->
                    savedRequests = list
                }
            }

            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = androidx.compose.ui.graphics.Color(0xFF2563EB),
                    background = androidx.compose.ui.graphics.Color(0xFF0F172A),
                    surface = androidx.compose.ui.graphics.Color(0xFF1E293B)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = androidx.compose.ui.graphics.Color(0xFF0F172A)
                ) {
                    MainScreen(
                        modules = PREDEFINED_MODULES,
                        savedRequests = savedRequests,
                        onSave = { req ->
                            lifecycleScope.launch(Dispatchers.IO) {
                                dao.insertRequest(req)
                                withContext(Dispatchers.Main) {
                                    Toast.makeText(this@MainActivity, "تم حفظ طلب العميل بنجاح!", Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        onDelete = { id ->
                            lifecycleScope.launch(Dispatchers.IO) {
                                dao.deleteRequestById(id)
                                withContext(Dispatchers.Main) {
                                    Toast.makeText(this@MainActivity, "تم حذف الطلب من السجل", Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        onExportPdf = { list ->
                            exportRequestsToPdf(this@MainActivity, list)
                        }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    modules: List<LedModule>,
    savedRequests: List<ClientRequest>,
    onSave: (ClientRequest) -> Unit,
    onDelete: (Long) -> Unit,
    onExportPdf: (List<ClientRequest>) -> Unit
) {
    var clientName by remember { mutableStateOf("") }
    var reqWidthStr by remember { mutableStateOf("3.0") }
    var reqHeightStr by remember { mutableStateOf("2.0") }
    var dimensionUnit by remember { mutableStateOf("m") } // "m" or "cm"
    var isDoubleSided by remember { mutableStateOf(false) }
    var selectedModule by remember { mutableStateOf(modules[0]) }
    var showHistoryDialog by remember { mutableStateOf(false) }

    // Parse values safely
    val reqWidth = reqWidthStr.toDoubleOrNull() ?: 0.0
    val reqHeight = reqHeightStr.toDoubleOrNull() ?: 0.0

    // Conversions to meters
    val reqWidthM = if (dimensionUnit == "m") reqWidth else reqWidth / 100.0
    val reqHeightM = if (dimensionUnit == "m") reqHeight else reqHeight / 100.0

    // Module specifications
    val modWidthM = selectedModule.widthMm / 1000.0
    val modHeightM = selectedModule.heightMm / 1000.0

    // Core Calculations
    val modulesHoriz = kotlin.math.max(1, kotlin.math.round(reqWidthM / modWidthM).toInt())
    val modulesVert = kotlin.math.max(1, kotlin.math.round(reqHeightM / modHeightM).toInt())
    
    val sidesCount = if (isDoubleSided) 2 else 1
    val totalModules = modulesHoriz * modulesVert * sidesCount

    val actualWidthM = modulesHoriz * modWidthM
    val actualHeightM = modulesVert * modHeightM

    // Power Calculation (assume 5V power supply of 40A = 200W)
    val totalPowerWatts = totalModules * selectedModule.wattPower
    val powerSuppliesCount = kotlin.math.ceil(totalPowerWatts / 200.0).toInt()

    // Receiving Cards (1 card handles approx 256x256 pixels, approx 16-24 modules depending on pitch)
    val totalReceivingCards = kotlin.math.ceil(totalModules / 12.0).toInt()

    // Financial estimations
    val costModules = totalModules * selectedModule.priceUsd
    val costStructure = actualWidthM * actualHeightM * 45.0 * sidesCount
    val costAccessories = (powerSuppliesCount * 12.0) + (totalReceivingCards * 15.0)
    val totalCost = costModules + costStructure + costAccessories

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.End
    ) {
        // App Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { showHistoryDialog = true }) {
                Icon(
                    imageVector = Icons.Default.History,
                    contentDescription = "السجل",
                    tint = androidx.compose.ui.graphics.Color(0xFF60A5FA)
                )
            }
            Text(
                text = "حاسبة شاشات LED أضواء الرباط",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = androidx.compose.ui.graphics.Color.White,
                textAlign = TextAlign.End
            )
        }

        LazyColumn(
            modifier = Modifier.weight(1fr),
            horizontalAlignment = Alignment.End
        ) {
            item {
                // Client Name Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalAlignment = Alignment.End
                    ) {
                        Text("اسم العميل:", fontSize = 12.sp, color = androidx.compose.ui.graphics.Color.Gray)
                        OutlinedTextField(
                            value = clientName,
                            onValueChange = { clientName = it },
                            placeholder = { Text("أدخل اسم العميل أو الجهة هنا...", fontSize = 12.sp) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 4.dp),
                            singleLine = true,
                            textStyle = androidx.compose.ui.text.TextStyle(textAlign = TextAlign.Right)
                        )
                    }
                }
            }

            item {
                // Dimensions input Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalAlignment = Alignment.End
                    ) {
                        Text("الأبعاد المطلوبة للشاشة:", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                RadioButton(selected = dimensionUnit == "cm", onClick = { dimensionUnit = "cm" })
                                Text("سم", fontSize = 12.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                RadioButton(selected = dimensionUnit == "m", onClick = { dimensionUnit = "m" })
                                Text("متر", fontSize = 12.sp)
                            }
                            Text("وحدة القياس:", fontSize = 12.sp, color = androidx.compose.ui.graphics.Color.Gray)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), gap = 8.dp) {
                            OutlinedTextField(
                                value = reqHeightStr,
                                onValueChange = { reqHeightStr = it },
                                label = { Text("الارتفاع مطلوب", fontSize = 11.sp) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                modifier = Modifier.weight(1f),
                                textStyle = androidx.compose.ui.text.TextStyle(textAlign = TextAlign.Center)
                            )
                            OutlinedTextField(
                                value = reqWidthStr,
                                onValueChange = { reqWidthStr = it },
                                label = { Text("العرض مطلوب", fontSize = 11.sp) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                modifier = Modifier.weight(1f),
                                textStyle = androidx.compose.ui.text.TextStyle(textAlign = TextAlign.Center)
                            )
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 12.dp),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("شاشة بوجهين (Double Sided)", fontSize = 12.sp)
                            Checkbox(checked = isDoubleSided, onCheckedChange = { isDoubleSided = it })
                        }
                    }
                }
            }

            item {
                // Modules list select
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalAlignment = Alignment.End
                    ) {
                        Text("اختر موديل المديول (LED Module Model):", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(6.dp))
                        modules.forEach { mod ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        if (selectedModule.id == mod.id) androidx.compose.ui.graphics.Color(
                                            0xFF2563EB
                                        ).copy(alpha = 0.15f)
                                        else androidx.compose.ui.graphics.Color.Transparent
                                    )
                                    .border(
                                        1.dp,
                                        if (selectedModule.id == mod.id) androidx.compose.ui.graphics.Color(
                                            0xFF2563EB
                                        )
                                        else androidx.compose.ui.graphics.Color.Transparent,
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clickable { selectedModule = mod }
                                    .padding(8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("$${mod.priceUsd}", color = androidx.compose.ui.graphics.Color(0xFF34D399), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                Text(mod.name, color = if (selectedModule.id == mod.id) androidx.compose.ui.graphics.Color.White else androidx.compose.ui.graphics.Color.LightGray, fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                        }
                    }
                }
            }

            item {
                // Technical Report & Calculations Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color(0xFF1E293B))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalAlignment = Alignment.End
                    ) {
                        Text("الحسابات الفنية والتقدير المالي:", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = androidx.compose.ui.graphics.Color(0xFF60A5FA))
                        Divider(modifier = Modifier.padding(vertical = 8.dp), color = androidx.compose.ui.graphics.Color.Gray.copy(alpha = 0.3f))

                        ReportItem("المقاس المطلوب", "$reqWidth × $reqHeight ${if(dimensionUnit=="m") "متر" else "سم"}")
                        ReportItem("المقاس الفعلي النهائي", String.format("%.2f × %.2f متر", actualWidthM, actualHeightM))
                        ReportItem("إجمالي عدد المديولات", "$totalModules قطعة مديول ($modulesHoriz عرض × $modulesVert ارتفاع)")
                        ReportItem("محولات الطاقة (5V 40A)", "$powerSuppliesCount محولات بقدرة $totalPowerWatts واط")
                        ReportItem("كروت الاستقبال (Receiving Cards)", "$totalReceivingCards كرت استقبال")
                        ReportItem("إجمالي التكلفة التقديرية", String.format("$ %,.0f USD", totalCost))
                    }
                }
            }
        }

        // Action Buttons Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = {
                    if (clientName.trim().isEmpty()) {
                        Toast.makeText(LocalContext.current, "الرجاء كتابة اسم العميل أولاً لحفظ الطلب!", Toast.LENGTH_SHORT).show()
                    } else {
                        val dateFormat = SimpleDateFormat("yyyy/MM/dd HH:mm", Locale.getDefault())
                        val currentDate = dateFormat.format(Date())
                        onSave(
                            ClientRequest(
                                clientName = clientName,
                                dateString = currentDate,
                                reqWidth = reqWidth,
                                reqHeight = reqHeight,
                                dimensionUnit = dimensionUnit,
                                isDoubleSided = isDoubleSided,
                                moduleName = selectedModule.name,
                                actualWidthM = actualWidthM,
                                actualHeightM = actualHeightM,
                                totalModules = totalModules,
                                powerSuppliesCount = powerSuppliesCount,
                                totalReceivingCards = totalReceivingCards,
                                totalCost = totalCost,
                                currency = "USD"
                            )
                        )
                    }
                },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = androidx.compose.ui.graphics.Color(0xFF10B981))
            ) {
                Icon(imageVector = Icons.Default.Save, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("حفظ الطلب", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { showHistoryDialog = true },
                modifier = Modifier.weight(1f)
            ) {
                Icon(imageVector = Icons.Default.FolderOpen, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("السجل والتقارير", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }

    // Saved History Dialog (Modal Overlay)
    if (showHistoryDialog) {
        Dialog(onDismissRequest = { showHistoryDialog = false }) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.85f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color(0xFF0F172A))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.End
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = { showHistoryDialog = false }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "إغلاق", tint = androidx.compose.ui.graphics.Color.White)
                        }
                        Text("سجل تقارير العملاء", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = androidx.compose.ui.graphics.Color.White)
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (savedRequests.isEmpty()) {
                        Box(modifier = Modifier.weight(1fr).fillMaxWidth(), contentAlignment = Alignment.Center) {
                            Text("السجل فارغ تماماً حالياً", color = androidx.compose.ui.graphics.Color.Gray, fontSize = 12.sp)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.weight(1fr).fillMaxWidth(),
                            horizontalAlignment = Alignment.End
                        ) {
                            items(savedRequests) { req ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color(0xFF1E293B))
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(10.dp),
                                        horizontalAlignment = Alignment.End
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            IconButton(onClick = { onDelete(req.id) }) {
                                                Icon(imageVector = Icons.Default.Delete, contentDescription = "حذف", tint = androidx.compose.ui.graphics.Color.Red)
                                            }
                                            Column(horizontalAlignment = Alignment.End) {
                                                Text(req.clientName, fontWeight = FontWeight.Bold, color = androidx.compose.ui.graphics.Color.White)
                                                Text(req.dateString, fontSize = 9.sp, color = androidx.compose.ui.graphics.Color.Gray)
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("مقاس الشاشة: ${req.reqWidth} × ${req.reqHeight} (${if(req.dimensionUnit=="m") "متر" else "سم"})", fontSize = 11.sp, color = androidx.compose.ui.graphics.Color.LightGray)
                                        Text("موديل المديول: ${req.moduleName}", fontSize = 11.sp, color = androidx.compose.ui.graphics.Color.LightGray)
                                        Text("المقاس الفعلي: ${req.actualWidthM} × ${req.actualHeightM} متر (${if(req.isDoubleSided) "وجهين" else "وجه واحد"})", fontSize = 11.sp, color = androidx.compose.ui.graphics.Color.LightGray)
                                        Text(String.format("التكلفة: $ %,.0f USD", req.totalCost), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = androidx.compose.ui.graphics.Color(0xFF34D399))
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                if (savedRequests.isNotEmpty()) {
                                    onExportPdf(savedRequests)
                                }
                            },
                            enabled = savedRequests.isNotEmpty(),
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = androidx.compose.ui.graphics.Color(0xFF2563EB))
                        ) {
                            Icon(imageVector = Icons.Default.PictureAsPdf, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("تصدير السجل PDF", fontSize = 11.sp)
                        }

                        Button(
                            onClick = { showHistoryDialog = false },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = androidx.compose.ui.graphics.Color.Gray)
                        ) {
                            Text("إغلاق", fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ReportItem(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(value, color = androidx.compose.ui.graphics.Color.White, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        Text(label, color = androidx.compose.ui.graphics.Color.LightGray, fontSize = 12.sp)
    }
}

// Native Android PDF Generator
fun exportRequestsToPdf(context: Context, requests: List<ClientRequest>) {
    val pdfDocument = PdfDocument()
    
    // Page 1 size A4 (595 x 842 points)
    val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
    val page = pdfDocument.startPage(pageInfo)
    val canvas = page.canvas
    
    val paint = Paint()
    val textPaint = Paint().apply {
        color = Color.BLACK
        textSize = 10f
        isAntiAlias = true
    }
    
    val headerPaint = Paint().apply {
        color = Color.rgb(30, 58, 138) // Deep Blue
        textSize = 14f
        isFakeBoldText = true
        isAntiAlias = true
    }

    val tableHeaderPaint = Paint().apply {
        color = Color.rgb(241, 245, 249) // Light Grey
    }

    val linePaint = Paint().apply {
        color = Color.LTGRAY
        strokeWidth = 1f
    }

    // Title & Brand info
    canvas.drawText("أضواء الرباط للكهرباء وشاشات LED", 380f, 40f, headerPaint)
    canvas.drawText("سجل تقارير وعروض أسعار العملاء", 395f, 60f, textPaint.apply { textSize = 11f; isFakeBoldText = true })
    canvas.drawText("صنعاء - اليمن | هاتف: 777220777", 405f, 75f, textPaint.apply { textSize = 8f; isFakeBoldText = false })

    canvas.drawLine(30f, 90f, 565f, 90f, linePaint.apply { strokeWidth = 2f; color = Color.rgb(30, 58, 138) })

    // Table Headers
    canvas.drawRect(30f, 105f, 565f, 125f, tableHeaderPaint)
    canvas.drawLine(30f, 105f, 565f, 105f, linePaint)
    canvas.drawLine(30f, 125f, 565f, 125f, linePaint)

    val thPaint = Paint().apply { color = Color.BLACK; textSize = 9f; isFakeBoldText = true; isAntiAlias = true }
    canvas.drawText("التكلفة", 40f, 118f, thPaint)
    canvas.drawText("المقاس الفعلي", 120f, 118f, thPaint)
    canvas.drawText("موديل الشاشة", 260f, 118f, thPaint)
    canvas.drawText("تاريخ الحفظ", 380f, 118f, thPaint)
    canvas.drawText("اسم العميل الكريم", 470f, 118f, thPaint)

    // Table Content
    var currentY = 140f
    requests.take(20).forEachIndexed { index, req ->
        canvas.drawText(String.format("$ %,.0f", req.totalCost), 40f, currentY, textPaint.apply { isFakeBoldText = true; textSize = 9f })
        canvas.drawText(String.format("%.2f x %.2f m", req.actualWidthM, req.actualHeightM), 120f, currentY, textPaint.apply { isFakeBoldText = false })
        canvas.drawText(req.moduleName, 260f, currentY, textPaint)
        canvas.drawText(req.dateString, 380f, currentY, textPaint)
        canvas.drawText(req.clientName, 470f, currentY, textPaint.apply { isFakeBoldText = true })

        canvas.drawLine(30f, currentY + 6, 565f, currentY + 6, linePaint.apply { strokeWidth = 0.5f; color = Color.LTGRAY })
        currentY += 25f
    }

    // Footer info
    canvas.drawText("مؤسسة أضواء الرباط لتقنية شاشات الـ LED • صنعاء - اليمن", 180f, 810f, textPaint.apply { textSize = 8f; color = Color.GRAY })

    pdfDocument.finishPage(page)

    // Save File
    val directory = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
    val file = File(directory, "LED_Rabat_Requests_Report.pdf")
    
    try {
        pdfDocument.writeTo(FileOutputStream(file))
        Toast.makeText(context, "تم تصدير ملف PDF بنجاح في مجلد Downloads!", Toast.LENGTH_LONG).show()
    } catch (e: Exception) {
        e.printStackTrace()
        Toast.makeText(context, "فشل تصدير ملف PDF: ${e.message}", Toast.LENGTH_SHORT).show()
    } finally {
        pdfDocument.close()
    }
}
